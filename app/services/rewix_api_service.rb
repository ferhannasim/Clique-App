# app/services/rewix_api_service.rb
require 'httparty'
require 'base64'

class RewixApiService
  include HTTParty
  base_uri 'https://www.griffati.com/restful/export/api'

  def initialize(api_key, password)
    @api_key = api_key
    @password = password

    @headers = {
      'Accept' => 'application/xml',
      'Authorization' => "Basic"  + Base64.strict_encode64("#{api_key}:#{password}")
    }
  end

  def fetch_products
    response = self.class.get('/products.xml', headers: @headers)
    if response.success?
      response.body
    else
      raise "Failed to fetch products: #{response.message}"
    end
  end

  private

  # def encode_credentials(api_key, password)
  #   Base64.strict_encode64("#{api_key}:#{password}")
  # end
end
