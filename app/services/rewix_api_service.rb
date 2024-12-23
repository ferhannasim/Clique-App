# app/services/rewix_api_service.rb
require 'httparty'
require 'base64'

class RewixApiService
  include HTTParty
  base_uri 'https://griffati.rewix.zero11.org/restful/export/api'

  def initialize(api_key, password)
    @api_key = api_key
    @password = password

    @headers = {
      'Accept' => 'application/xml',
      'Authorization' => "Basic "  + Base64.strict_encode64("#{api_key}:#{password}")
    }
  end

  def fetch_products
    response = self.class.get('/products.json', headers: @headers)
    if response.success?
      response.body
    else
      raise "Failed to fetch products: #{response.message}"
    end
  end

  def lock_quantity(data)
    headers = @headers.merge('Content-Type' => 'application/json')
    response = self.class.post('https://griffati.rewix.zero11.org/restful/ghost/orders/sold', headers: headers, body: data.to_json)
    if response.success?
      response.body
    else
      raise "Failed to create order: #{response}"
    end
  end
end
