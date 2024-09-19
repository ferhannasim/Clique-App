# frozen_string_literal: true

class HomeController < ApplicationController
  include ShopifyApp::EmbeddedApp
  include ShopifyApp::EnsureInstalled
  include ShopifyApp::ShopAccessScopesVerification

  def index
    if ShopifyAPI::Context.embedded? && (!params[:embedded].present? || params[:embedded] != "1")
      redirect_to(ShopifyAPI::Auth.embedded_app_url(params[:host]) + request.path, allow_other_host: true)
    else
      @shop_origin = current_shopify_domain
      @host = params[:host]
    end
    @products = fetch_products_from_api
  end
  
  private

  def fetch_products_from_api
    [
      { id: 1, title: "Benjamin Bookcase", status: "Active", inventory: "20 in stock", type: "Furniture", vendor: "Stellar", dropship_supplier: "Stellar",     
        warehouse_location: "Rome", subcategory: "T-Shirts", qty: 30 },
      { id: 2, title: "Maven Lounge Chair", status: "Draft", inventory: "10 in stock", type: "Furniture", vendor: "Stellar", dropship_supplier: "Stellar",   
        warehouse_location: "Rome", subcategory: "Chairs", qty: 20 },
      { id: 2, title: "Maven Lounge Chair", status: "Draft", inventory: "10 in stock", type: "Furniture", vendor: "Stellar", dropship_supplier: "Stellar",
        warehouse_location: "Rome", subcategory: "Chairs", qty: 20 },
      { id: 2, title: "Maven Lounge Chair", status: "Draft", inventory: "10 in stock", type: "Furniture", vendor: "Stellar", dropship_supplier: "Stellar",
        warehouse_location: "Rome", subcategory: "Chairs", qty: 20 },
      { id: 2, title: "Maven Lounge Chair", status: "Draft", inventory: "10 in stock", type: "Furniture", vendor: "Stellar", dropship_supplier: "Stellar",
        warehouse_location: "Rome", subcategory: "Chairs", qty: 20 },
      { id: 2, title: "Maven Lounge Chair", status: "Draft", inventory: "10 in stock", type: "Furniture", vendor: "Stellar", dropship_supplier: "Stellar",
        warehouse_location: "Rome", subcategory: "Chairs", qty: 20 },
      { id: 2, title: "Maven Lounge Chair", status: "Draft", inventory: "10 in stock", type: "Furniture", vendor: "Stellar", dropship_supplier: "Stellar",
        warehouse_location: "Rome", subcategory: "Chairs", qty: 20 },
      { id: 2, title: "Maven Lounge Chair", status: "Draft", inventory: "10 in stock", type: "Furniture", vendor: "Stellar", dropship_supplier: "Stellar",
        warehouse_location: "Rome", subcategory: "Chairs", qty: 20 },
      { id: 2, title: "Maven Lounge Chair", status: "Draft", inventory: "10 in stock", type: "Furniture", vendor: "Stellar", dropship_supplier: "Stellar",
        warehouse_location: "Rome", subcategory: "Chairs", qty: 20 },
      { id: 2, title: "Maven Lounge Chair", status: "Draft", inventory: "10 in stock", type: "Furniture", vendor: "Stellar", dropship_supplier: "Stellar",
        warehouse_location: "Rome", subcategory: "Chairs", qty: 20 },
    ]
  end
end
