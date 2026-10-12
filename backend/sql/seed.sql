-- Restaurant Supply Management System
-- Seed SQL Script

-- SUPPLIER
INSERT INTO supplier (supplier_id, supplier_name, contact_no, city) VALUES (1001, 'Fresh Foods Ltd', '9876543210', 'Chennai');
INSERT INTO supplier (supplier_id, supplier_name, contact_no, city) VALUES (1002, 'KitchenPro Supplies', '9876543211', 'Bangalore');
INSERT INTO supplier (supplier_id, supplier_name, contact_no, city) VALUES (1003, 'Prime Ingredients', '9876543212', 'Hyderabad');
INSERT INTO supplier (supplier_id, supplier_name, contact_no, city) VALUES (1004, 'Daily Harvest', '9876543213', 'Mumbai');
INSERT INTO supplier (supplier_id, supplier_name, contact_no, city) VALUES (1005, 'Global Kitchen Co', '9876543214', 'Delhi');

-- RESTAURANT
INSERT INTO restaurant (restaurant_id, restaurant_name, city, phone) VALUES (2001, 'Spice Garden', 'Chennai', '9123456780');
INSERT INTO restaurant (restaurant_id, restaurant_name, city, phone) VALUES (2002, 'Urban Bites', 'Bangalore', '9123456781');
INSERT INTO restaurant (restaurant_id, restaurant_name, city, phone) VALUES (2003, 'Taste Hub', 'Hyderabad', '9123456782');
INSERT INTO restaurant (restaurant_id, restaurant_name, city, phone) VALUES (2004, 'Royal Feast', 'Mumbai', '9123456783');
INSERT INTO restaurant (restaurant_id, restaurant_name, city, phone) VALUES (2005, 'Food Street', 'Delhi', '9123456784');

-- WAREHOUSE
INSERT INTO warehouse (warehouse_id, warehouse_name, city, capacity) VALUES (3001, 'Central Warehouse', 'Chennai', 10000);
INSERT INTO warehouse (warehouse_id, warehouse_name, city, capacity) VALUES (3002, 'North Warehouse', 'Delhi', 8000);
INSERT INTO warehouse (warehouse_id, warehouse_name, city, capacity) VALUES (3003, 'South Warehouse', 'Bangalore', 7500);
INSERT INTO warehouse (warehouse_id, warehouse_name, city, capacity) VALUES (3004, 'East Warehouse', 'Hyderabad', 6000);
INSERT INTO warehouse (warehouse_id, warehouse_name, city, capacity) VALUES (3005, 'West Warehouse', 'Mumbai', 9000);

-- PRODUCT
INSERT INTO product (product_id, product_name, category, unit_cost, supplier_id) VALUES (4001, 'Basmati Rice', 'Grains', 85.00, 1001);
INSERT INTO product (product_id, product_name, category, unit_cost, supplier_id) VALUES (4002, 'Sunflower Oil', 'Oil', 145.00, 1002);
INSERT INTO product (product_id, product_name, category, unit_cost, supplier_id) VALUES (4003, 'Tomato Sauce', 'Sauces', 120.00, 1003);
INSERT INTO product (product_id, product_name, category, unit_cost, supplier_id) VALUES (4004, 'Chicken Breast', 'Meat', 280.00, 1004);
INSERT INTO product (product_id, product_name, category, unit_cost, supplier_id) VALUES (4005, 'Cheese Block', 'Dairy', 350.00, 1005);

-- INVENTORY
INSERT INTO inventory (inventory_id, product_id, warehouse_id, stock_qty, reorder_level) VALUES (5001, 4001, 3001, 500, 100);
INSERT INTO inventory (inventory_id, product_id, warehouse_id, stock_qty, reorder_level) VALUES (5002, 4002, 3002, 250, 50);
INSERT INTO inventory (inventory_id, product_id, warehouse_id, stock_qty, reorder_level) VALUES (5003, 4003, 3003, 180, 40);
INSERT INTO inventory (inventory_id, product_id, warehouse_id, stock_qty, reorder_level) VALUES (5004, 4004, 3004, 120, 30);
INSERT INTO inventory (inventory_id, product_id, warehouse_id, stock_qty, reorder_level) VALUES (5005, 4005, 3005, 90, 20);

-- PURCHASE_ORDER
INSERT INTO purchase_order (order_id, order_date, supplier_id, restaurant_id, order_status) VALUES (6001, TO_DATE('10-AUG-2026', 'DD-MON-YYYY'), 1001, 2001, 'Delivered');
INSERT INTO purchase_order (order_id, order_date, supplier_id, restaurant_id, order_status) VALUES (6002, TO_DATE('11-AUG-2026', 'DD-MON-YYYY'), 1002, 2002, 'Pending');
INSERT INTO purchase_order (order_id, order_date, supplier_id, restaurant_id, order_status) VALUES (6003, TO_DATE('12-AUG-2026', 'DD-MON-YYYY'), 1003, 2003, 'Delivered');
INSERT INTO purchase_order (order_id, order_date, supplier_id, restaurant_id, order_status) VALUES (6004, TO_DATE('13-AUG-2026', 'DD-MON-YYYY'), 1004, 2004, 'Processing');
INSERT INTO purchase_order (order_id, order_date, supplier_id, restaurant_id, order_status) VALUES (6005, TO_DATE('14-AUG-2026', 'DD-MON-YYYY'), 1005, 2005, 'Pending');

-- ORDER_ITEM
INSERT INTO order_item (order_item_id, order_id, product_id, quantity, total_cost) VALUES (7001, 6001, 4001, 100, 8500);
INSERT INTO order_item (order_item_id, order_id, product_id, quantity, total_cost) VALUES (7002, 6002, 4002, 50, 7250);
INSERT INTO order_item (order_item_id, order_id, product_id, quantity, total_cost) VALUES (7003, 6003, 4003, 40, 4800);
INSERT INTO order_item (order_item_id, order_id, product_id, quantity, total_cost) VALUES (7004, 6004, 4004, 25, 7000);
INSERT INTO order_item (order_item_id, order_id, product_id, quantity, total_cost) VALUES (7005, 6005, 4005, 20, 7000);

COMMIT;
