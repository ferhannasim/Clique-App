class CreateProducts < ActiveRecord::Migration[7.0]
  def change
    create_table :products do |t|
      t.bigint :shopify_product_id
      t.string :status
      t.string :inventory
      t.string :type
      t.string :vendor
      t.string :dropship_supplier
      t.string :warehouse_location
      t.string :subcategory
      t.decimal :quantity
      t.decimal :unit_cost_eur
      t.decimal :cost_of_dropship_carrier_eur
      t.decimal :unit_cost_usd
      t.decimal :unit_cost_egp
      t.decimal :cost_of_kg
      t.decimal :unit_weight_gr
      t.decimal :unit_cost_including_weight_usd
      t.decimal :unit_cost_including_weight_egp
      t.decimal :gross_margin
      t.decimal :final_price


      t.timestamps
    end
  end
end
