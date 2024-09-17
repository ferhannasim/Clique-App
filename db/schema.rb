# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2024_09_09_140208) do
  create_table "products", force: :cascade do |t|
    t.bigint "shopify_product_id"
    t.string "status"
    t.string "inventory"
    t.string "type"
    t.string "vendor"
    t.string "dropship_supplier"
    t.string "warehouse_location"
    t.string "subcategory"
    t.decimal "quantity"
    t.decimal "unit_cost_eur"
    t.decimal "cost_of_dropship_carrier_eur"
    t.decimal "unit_cost_usd"
    t.decimal "unit_cost_egp"
    t.decimal "cost_of_kg"
    t.decimal "unit_weight_gr"
    t.decimal "unit_cost_including_weight_usd"
    t.decimal "unit_cost_including_weight_egp"
    t.decimal "gross_margin"
    t.decimal "final_price"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "shops", force: :cascade do |t|
    t.string "shopify_domain", null: false
    t.string "shopify_token", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "access_scopes", default: "", null: false
    t.index ["shopify_domain"], name: "index_shops_on_shopify_domain", unique: true
  end

end
