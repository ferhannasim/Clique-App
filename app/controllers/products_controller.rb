# frozen_string_literal: true
class ProductsController < ApplicationController
  CACHE_KEY = "rewix_products"
  PER_PAGE = 20

  def index
  end

  def fetch_products_from_api
    page = params[:page].to_i > 0 ? params[:page].to_i : 1
    per_page = PER_PAGE

    total_products = Product.count
    products = Product.order(:created_at).offset((page - 1) * per_page).limit(per_page)

    total_pages = (total_products / per_page.to_f).ceil

    render json: {
      products: products,
      current_page: page,
      total_pages: total_pages
    }
  end

  def products_data_summary
    suppliers_count = Product.distinct.count(:dropship_supplier)
    brands_count = Product.distinct.count(:vendor)
    total_inventory = Product.sum(:quantity)
    warehouse_locations_count = Product.distinct.count(:warehouse_location)
    potential_revenue = Product.sum('final_price * quantity')
    potential_gross_profit = Product.sum('final_price * quantity - unit_cost_egp * quantity')

    summary_data = {
      suppliers: suppliers_count,
      brands: brands_count,
      inventory: total_inventory,
      warehouse_locations: warehouse_locations_count,
      potential_revenue: potential_revenue.round(2),
      potential_gross_profit: potential_gross_profit.round(2)
    }

    render json: summary_data
  end

  def sync_products
    rewix_service = RewixApiService.new('272000ec-9039-4c4e-a874-6dd5ea741b31', 'Cliqueadmin1')
    fetched_products = rewix_service.fetch_products
    if fetched_products.present?
      parsed_products = JSON.parse(fetched_products)["pageItems"]

      parsed_products.take(1).each do |product_data|
         
        category_tag = product_data["tags"].find { |tag| tag["name"] == "category" }
        brand_tag = product_data["tags"].find { |tag| tag["name"] == "brand" }
        subcategory_tag = product_data["tags"].find { |tag| tag["name"] == "subcategory" }
        cost_of_dropship_carrier_eur = 9.8

        exchange_service = CurrencyExchange.new
        unit_cost_usd = exchange_service.convert((product_data["taxable"] + cost_of_dropship_carrier_eur), 'EUR', 'USD')

        egp_exchange_rate = PriceSetting.last.final_black_market_price.to_f
        unit_cost_egp = unit_cost_usd.to_f * egp_exchange_rate
        cost_of_kg = PriceSetting.last.cost_of_kg.to_f
        cost_of_gram = product_data["weight"] / 1000
        unit_cost_including_weight_usd = cost_of_gram * cost_of_kg
        # unit_cost_including_weight_egp = cost_of_kg * egp_exchange_rate
        gross_margin = PriceSetting.last.gross_margin.to_f

        final_price = (((((unit_cost_usd.to_f + unit_cost_including_weight_usd).round(2)) * egp_exchange_rate).round(2)) * 1.45).round(2)

        # final_price = unit_cost_including_weight_egp + (unit_cost_including_weight_egp * gross_margin)
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
                         cost_of_gram: cost_of_kg/1000,
                         unit_weight_gr: product_data["weight"],
                         unit_cost_including_weight_usd: (unit_cost_usd.to_f + unit_cost_including_weight_usd).round(2),
                         unit_cost_including_weight_egp: (((unit_cost_usd.to_f + unit_cost_including_weight_usd).round(2)) * egp_exchange_rate).round(2),
                         gross_margin: gross_margin,
                         final_price: final_price,
                         shop_id: Shop.last.id
                       })

        product = Product.find_by(external_id: product_data["id"])

    #     product = Product.last
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

        inventory_params = {
          location_id: location_id,
          quantities: [product.quantity]
        }

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

         

        product_id = service.create_product_with_variants_and_inventory(product_params, variant_params, media_params, product)
        shopify_product_id = product_id.gsub(/\D/, '')
        product.update(shopify_product_id: shopify_product_id)
         
        #
        # product_data["models"].each do |variant_data|
        #   Variant.upsert(
        #     {
        #       shopify_product_id: shopify_product_id,
        #       price: variant_data["streetPrice"],
        #       sku: variant_data["code"],
        #       title: "#{variant_data['model']} - #{variant_data['color']} - #{variant_data['size']}",
        #       inventory_quantity: variant_data["availability"],
        #       weight: variant_data["modelWeight"],
        #       taxable: variant_data["taxable"] > 0,
        #       barcode: variant_data["barcode"],
        #       product: product
        #     }
        #   )
        # end

        puts "Product created with ID: #{product_id}" if product_id
      end


    else
      render json: { error: "Failed to fetch products" }, status: :unprocessable_entity
    end
  end
end
