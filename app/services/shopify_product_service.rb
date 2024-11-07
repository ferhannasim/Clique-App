class ShopifyProductService
  def initialize(shop_domain, access_token)
    @session = ShopifyAPI::Auth::Session.new(
      shop: shop_domain,
      access_token: access_token
    )
    @client = ShopifyAPI::Clients::Graphql::Admin.new(
      session: @session
    )
  end

  def create_product_with_variants_and_inventory(product_params, variant_params, media_params, product)
    product_id_info = create_product(product_params, variant_params, product)

    return unless product_id_info

    add_product_media(product_id_info[:product_id], media_params)

    product_id_info[:product_id]
  end

  def fetch_location_id
    query = <<~QUERY
      {
        locations(first: 1) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    QUERY

    response = @client.query(query: query)

    if response.body["data"]["locations"]["edges"].any?
      response.body["data"]["locations"]["edges"][0]["node"]["id"]
    else
      puts "No locations found"
      nil
    end
  end

  # Create the product
  def create_product(product_params, variant_params, product)
    query = <<~GRAPHQL
    mutation CreateProductWithOptions($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          bodyHtml
          vendor
          productType
          options {
            name
            values
            id
            position
          }
          variants(first: 5) {
            nodes {
              id
              title
              selectedOptions {
                name
                value
              }
              price
              sku
              weight
              weightUnit
            }
          }
        }
        userErrors {
          message
          field
        }
      }
    GRAPHQL

    options = %w[Model Color Size]
    variants = variant_params.map do |variant|
      {
        title: variant[:title],
        sku: variant[:stock_id].to_s,
        price: variant[:final_price],
        weight: variant[:weight],
        weightUnit: variant[:weightUnit],
        requiresShipping: true,
        options: [variant[:model], variant[:color], variant[:size]]
      }
    end

    variables = {
      "input": {
        "title": product_params[:title],
        "bodyHtml": product_params[:bodyHtml],
        "vendor": product_params[:vendor],
        "productType": product_params[:productType],
        "options": options,
        "variants": variants
      }
    }

    response = @client.query(query: query, variables: variables)

    user_errors = response.body["data"]["productCreate"]["userErrors"]
    if user_errors.empty?
      product_data = response.body["data"]["productCreate"]["product"]

      variants_data = response.body.dig('data', 'productCreate', 'product', 'variants', 'nodes')
      return nil unless variants_data

      variants_data.each do |variant|
        save_variant_to_db(
          product_id: 1,
          shopify_product_id: product_data['id']&.gsub(/\D/, ''),
          shopify_variant_id: variant['id']&.gsub(/\D/, ''),
          title: variant['title'],
          sku: variant['sku'],
          price: variant['price'],
          weight: variant['weight'],
          weight_unit: variant['weightUnit']
        )
      end

      { product_id: product_data['id'] }
    else
      user_errors.each do |error|
        puts "Error creating product: #{error['message']} (Field: #{error['field']})"
      end
      nil
    end
  rescue => e
    puts "An unexpected error occurred while creating the product: #{e.message}"
    nil
  end

  def add_product_media(product_id, media_params)
    query = <<~QUERY
      mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
        productCreateMedia(media: $media, productId: $productId) {
          media {
            alt
            mediaContentType
            status
          }
          mediaUserErrors {
            field
            message
          }
        }
      }
    QUERY

    variables = {
      "media": media_params,
      "productId": product_id
    }

    response = @client.query(query: query, variables: variables)

    if response.body["data"]["productCreateMedia"]["mediaUserErrors"].empty?
      puts "Media added successfully"
    else
      puts "Error adding media: #{response.body["data"]["productCreateMedia"]["mediaUserErrors"]}"
    end
  end

  def add_variants(product_id, variant_params)
    query = <<~QUERY
      mutation productVariantCreate($input: ProductVariantInput!) {
        productVariantCreate(input: $input) {
          productVariant {
            id
            title
            inventoryItem {
              id
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    QUERY

    variant_params.each do |variant|
      variables = { "input": variant.merge(productId: product_id) }

      begin
        response = @client.query(query: query, variables: variables)

        if response.body["data"]["productVariantCreate"]["userErrors"].empty?
          shopify_variant_id = response.body["data"]["productVariantCreate"]["productVariant"]["id"]
          inventory_item_id = response.body["data"]["productVariantCreate"]["productVariant"]["inventoryItem"]["id"]

          puts "Variant #{variant[:title]} created successfully with ID: #{shopify_variant_id}"

        else
          puts "Error creating variant: #{response.body['data']['productVariantCreate']['userErrors']}"
        end

      rescue => e
        puts "Exception occurred while creating variant #{variant[:title]}: #{e.message}"
      end
    end
  end

  def update_product_price(shopify_product_id, new_price)
    query = <<~QUERY
      mutation productVariantUpdate($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    QUERY

    variables = {
      "input": {
        "id": shopify_product_id,
        "price": new_price.to_s
      }
    }

    response = @client.query(query: query, variables: variables)

    if response.body["data"]["productVariantUpdate"]["userErrors"].empty?
      puts "Product price updated successfully for variant #{shopify_product_id}"
    else
      puts "Error updating product price: #{response.body['data']['productVariantUpdate']['userErrors']}"
    end
  end

  def save_variant_to_db(product_id:, shopify_product_id:, shopify_variant_id:, title:, sku:, price:, weight:, weight_unit:)
    Variant.create(
      product_id: product_id,
      shopify_product_id: shopify_product_id,
      shopify_variant_id: shopify_variant_id,
      title: title,
      sku: sku,
      price: price,
      weight: weight,
      weight_unit: weight_unit
    )
  end

end
