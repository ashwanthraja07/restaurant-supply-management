-- Restaurant Supply Management System (SupplyFlow)
-- Oracle Database Schema Creation Script
-- Run this script in SQL*Plus or Oracle SQL Developer before running the seed script.

-- 1. SUPPLIER TABLE
CREATE TABLE supplier (
    supplier_id   NUMBER PRIMARY KEY,
    supplier_name VARCHAR2(100) NOT NULL,
    contact_no    VARCHAR2(20),
    city          VARCHAR2(50)
);

-- 2. RESTAURANT TABLE
CREATE TABLE restaurant (
    restaurant_id   NUMBER PRIMARY KEY,
    restaurant_name VARCHAR2(100) NOT NULL,
    city            VARCHAR2(50),
    phone           VARCHAR2(20)
);

-- 3. WAREHOUSE TABLE
CREATE TABLE warehouse (
    warehouse_id   NUMBER PRIMARY KEY,
    warehouse_name VARCHAR2(100) NOT NULL,
    city           VARCHAR2(50),
    capacity       NUMBER
);

-- 4. PRODUCT TABLE
CREATE TABLE product (
    product_id   NUMBER PRIMARY KEY,
    product_name VARCHAR2(100) NOT NULL,
    category     VARCHAR2(50),
    unit_cost    NUMBER(10, 2),
    supplier_id  NUMBER,
    CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id)
);

-- 5. INVENTORY TABLE
CREATE TABLE inventory (
    inventory_id  NUMBER PRIMARY KEY,
    product_id    NUMBER,
    warehouse_id  NUMBER,
    stock_qty     NUMBER DEFAULT 0,
    reorder_level NUMBER DEFAULT 0,
    CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES product(product_id),
    CONSTRAINT fk_inv_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id)
);

-- 6. PURCHASE_ORDER TABLE
CREATE TABLE purchase_order (
    order_id      NUMBER PRIMARY KEY,
    order_date    DATE DEFAULT SYSDATE,
    supplier_id   NUMBER,
    restaurant_id NUMBER,
    order_status  VARCHAR2(20) DEFAULT 'Pending',
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id),
    CONSTRAINT fk_po_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id)
);

-- 7. ORDER_ITEM TABLE
CREATE TABLE order_item (
    order_item_id NUMBER PRIMARY KEY,
    order_id      NUMBER,
    product_id    NUMBER,
    quantity      NUMBER,
    total_cost    NUMBER(10, 2),
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES purchase_order(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES product(product_id)
);

COMMIT;
