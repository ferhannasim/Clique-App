class SyncProductsJob
  include Sidekiq::Job

  def perform(shop_id)
    # rewix_service = RewixApiService.new('272000ec-9039-4c4e-a874-6dd5ea741b31', 'Cliqueadmin1')
    # fetched_products = rewix_service.fetch_products

    file_path = 'products.json'
    fetched_products = parse_triple_escaped_json(file_path)

    if fetched_products.present?
      parsed_products = fetched_products["pageItems"]

      parsed_products.each do |product_data|

        binding.pry

        next if Product.find_by(external_id: product_data["id"])

        binding.pry

        category_tag = product_data["tags"].find { |tag| tag["name"] == "category" }
        brand_tag = product_data["tags"].find { |tag| tag["name"] == "brand" }
        subcategory_tag = product_data["tags"].find { |tag| tag["name"] == "subcategory" }
        cost_of_dropship_carrier_eur = 9.8

        exchange_service = CurrencyExchange.new
        unit_cost_usd = exchange_service.convert((product_data["taxable"]), 'EUR', 'USD')

        egp_exchange_rate = PriceSetting.last.final_black_market_price.to_f
        unit_cost_egp = unit_cost_usd.to_f * egp_exchange_rate
        cost_of_kg = PriceSetting.last.cost_of_kg.to_f
        cost_of_gram = product_data["weight"] / 1000
        unit_cost_including_weight_usd = cost_of_gram * cost_of_kg
        gross_margin = PriceSetting.last.gross_margin.to_f

        category_weight = CategoryWeight.find_by(subcategory: subcategory_tag&.dig("value", "value"))&.weight

        final_price = (((((unit_cost_usd.to_f + unit_cost_including_weight_usd).round(2)) * egp_exchange_rate).round(2)) * 1.45).round(2)

        Product.upsert({
                         external_id: product_data["id"],
                         name: product_data["name"],
                         inventory: "#{product_data["availability"]} in stock for #{product_data['models'].count} variants",
                         category_type: category_tag&.dig("value", "value") || "Unknown Category",
                         vendor: brand_tag&.dig("value", "value") || "Unknown Brand",
                         dropship_supplier: "B2B graffiti",
                         warehouse_location: product_data["madein"],
                         subcategory: subcategory_tag&.dig("value", "value") || "Unknown Subcategory",
                         quantity: product_data["availability"],
                         image_url: product_data["images"][0]["url"],
                         unit_cost_eur: product_data["taxable"],
                         cost_of_dropship_carrier_eur: cost_of_dropship_carrier_eur,
                         unit_cost_usd: unit_cost_usd.to_f,
                         unit_cost_egp: unit_cost_egp.round(2),
                         cost_of_kg: cost_of_kg,
                         cost_of_gram: cost_of_kg / 1000,
                         unit_weight_gr: product_data["weight"],
                         actual_weight: category_weight.to_f,
                         unit_cost_including_weight_usd: (unit_cost_usd.to_f + unit_cost_including_weight_usd).round(2),
                         unit_cost_including_weight_egp: (((unit_cost_usd.to_f + unit_cost_including_weight_usd).round(2)) * egp_exchange_rate).round(2),
                         gross_margin: gross_margin,
                         final_price: final_price,
                         shop_id: shop_id
                       })

        product = Product.find_by(external_id: product_data["id"])

        shop = product.shop
        shop_domain = shop.shopify_domain
        access_token = shop.shopify_token

        service = ShopifyProductService.new(shop_domain, access_token)

        location_id = service.fetch_location_id

        product_params = {
          "title": product.name,
          "bodyHtml": "",
          "vendor": product.vendor,
          "productType": product.category_type,
          "variants": [
            {
              "price": product.final_price,
            }
          ]
        }

        media_params = [
          {
            "alt" => "#{product.name} Image",
            "mediaContentType" => "IMAGE",
            "originalSource" => "https://griffati.rewix.zero11.org#{product.image_url}"
          }
        ]

        variant_params = product_data["models"].map do |variant_data|
          {
            title: "#{variant_data['model']} - #{variant_data['color']} - #{variant_data['size']}",
            sku: variant_data["code"],
            price: variant_data["streetPrice"].to_s,
            inventoryQuantity: variant_data["availability"],
            weight: variant_data["modelWeight"],
            weightUnit: "KILOGRAMS",
            barcode: variant_data["barcode"],
            stock_id: variant_data["id"],
            model: variant_data['model'],
            color: variant_data['color'],
            size: variant_data['size'],
            final_price: product.final_price
          }
        end

        begin
          product_id = service.create_product_with_variants_and_inventory(product_params, variant_params, media_params, product)

          if product_id
            shopify_product_id = product_id.gsub(/\D/, '')
            product.update(shopify_product_id: shopify_product_id)
          else
            raise "Product creation failed: product_id is nil."
          end

        rescue StandardError => e
          Rails.logger.error("Failed to create product with variants and inventory: #{e.message}")
          Rails.logger.error(e.backtrace.join("\n"))
        end

        puts "Product created with ID: #{product_id}" if product_id

      end
    else
      render json: { error: "Failed to fetch products" }, status: :unprocessable_entity
    end
  end

  def parse_triple_escaped_json(file_path)
    raw_content = File.read(file_path)
    decoded_content = JSON.parse(raw_content)
    JSON.parse(decoded_content)
  end
end
