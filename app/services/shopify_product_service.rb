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

  def create_product_with_variants_and_inventory(product_params, variant_params, media_params, inventory_params)
    product_id_info = create_product(product_params)
    return unless product_id_info

    add_product_media(product_id_info[:product_id], media_params)

    add_variants(product_id_info[:product_id], variant_params) if variant_params.any?

    # Step 4: Update inventory levels
    # update_product_quantity(product_id_info, inventory_params)

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
  def create_product(product_params)
    query = <<~QUERY
      mutation createProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            variants(first: 10) {
              edges {
                node {
                  id
                  inventoryItem {
                    id
                  }
                }
              }
            }
          }
          userErrors {
            message
            field
          }
        }
      }
    QUERY

    variables = { "input": product_params }

    response = @client.query(query: query, variables: variables)

    if response.body["data"]["productCreate"]["userErrors"].empty?
      product_data = response.body["data"]["productCreate"]["product"]
      {
        product_id: product_data["id"],
        variant_inventory_items: product_data["variants"]["edges"].map { |edge| edge["node"]["inventoryItem"]["id"] }
      }
    else
      puts "Error creating product: #{response.body["data"]["productCreate"]["userErrors"]}"
      nil
    end
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

  # Add inventory levels for each variant
  # def update_product_quantity(product_id_info, inventory_params)
  #   inventory_items = product_id_info[:variant_inventory_items]
  #   location_id = inventory_params[:location_id]
  #   quantities = inventory_params[:quantities]
  #
  #   inventory_items.each_with_index do |inventory_item_id, index|
  #     # Use ShopifyAPI::InventoryLevel to adjust inventory
  #     session = @session  # The session has already been created in initialize
  #
  #     inventory_level = ShopifyAPI::InventoryLevel.new(session: session)
  #
  #     begin
  #       response = inventory_level.adjust(
  #         session: session,
  #         body: {
  #           "location_id" => location_id.split('/').last,
  #           "inventory_item_id" => inventory_item_id.split('/').last,
  #           "available_adjustment" => quantities[index].to_i
  #         }
  #       )
  #
  #       puts "Inventory for variant #{inventory_item_id} updated successfully to #{quantities[index]}."
  #     rescue => e
  #       puts "Error adjusting inventory for variant #{inventory_item_id}: #{e.message}"
  #     end
  #   end
  # end
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
          puts "Variant #{variant[:title]} created successfully with ID: #{response.body['data']['productVariantCreate']['productVariant']['id']}"
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
end
