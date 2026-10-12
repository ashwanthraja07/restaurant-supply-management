const path = require('path');
const fs = require('fs');
const oracledb = require('oracledb');
require('dotenv').config({ path: __dirname + '/../.env' });

const localClientDir = path.resolve(__dirname, '../instantclient_19_26');
if (fs.existsSync(localClientDir)) {
  try {
    oracledb.initOracleClient({ libDir: localClientDir });
  } catch (e) {
    // Ignore if already initialized
  }
}

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING
};

const seedData = {
  supplier: [
    { id: 1001, name: 'Fresh Foods Ltd', contact: '9876543210', city: 'Chennai' },
    { id: 1002, name: 'KitchenPro Supplies', contact: '9876543211', city: 'Bangalore' },
    { id: 1003, name: 'Prime Ingredients', contact: '9876543212', city: 'Hyderabad' },
    { id: 1004, name: 'Daily Harvest', contact: '9876543213', city: 'Mumbai' },
    { id: 1005, name: 'Global Kitchen Co', contact: '9876543214', city: 'Delhi' }
  ],
  restaurant: [
    { id: 2001, name: 'Spice Garden', city: 'Chennai', phone: '9123456780' },
    { id: 2002, name: 'Urban Bites', city: 'Bangalore', phone: '9123456781' },
    { id: 2003, name: 'Taste Hub', city: 'Hyderabad', phone: '9123456782' },
    { id: 2004, name: 'Royal Feast', city: 'Mumbai', phone: '9123456783' },
    { id: 2005, name: 'Food Street', city: 'Delhi', phone: '9123456784' }
  ],
  warehouse: [
    { id: 3001, name: 'Central Warehouse', city: 'Chennai', cap: 10000 },
    { id: 3002, name: 'North Warehouse', city: 'Delhi', cap: 8000 },
    { id: 3003, name: 'South Warehouse', city: 'Bangalore', cap: 7500 },
    { id: 3004, name: 'East Warehouse', city: 'Hyderabad', cap: 6000 },
    { id: 3005, name: 'West Warehouse', city: 'Mumbai', cap: 9000 }
  ],
  product: [
    { id: 4001, name: 'Basmati Rice', cat: 'Grains', cost: 85.00, sup: 1001 },
    { id: 4002, name: 'Sunflower Oil', cat: 'Oil', cost: 145.00, sup: 1002 },
    { id: 4003, name: 'Tomato Sauce', cat: 'Sauces', cost: 120.00, sup: 1003 },
    { id: 4004, name: 'Chicken Breast', cat: 'Meat', cost: 280.00, sup: 1004 },
    { id: 4005, name: 'Cheese Block', cat: 'Dairy', cost: 350.00, sup: 1005 }
  ],
  inventory: [
    { id: 5001, prod: 4001, wh: 3001, qty: 500, re: 100 },
    { id: 5002, prod: 4002, wh: 3002, qty: 250, re: 50 },
    { id: 5003, prod: 4003, wh: 3003, qty: 180, re: 40 },
    { id: 5004, prod: 4004, wh: 3004, qty: 120, re: 30 },
    { id: 5005, prod: 4005, wh: 3005, qty: 90, re: 20 }
  ],
  purchase_order: [
    { id: 6001, dt: '10-AUG-2026', sup: 1001, rest: 2001, st: 'Delivered' },
    { id: 6002, dt: '11-AUG-2026', sup: 1002, rest: 2002, st: 'Pending' },
    { id: 6003, dt: '12-AUG-2026', sup: 1003, rest: 2003, st: 'Delivered' },
    { id: 6004, dt: '13-AUG-2026', sup: 1004, rest: 2004, st: 'Processing' },
    { id: 6005, dt: '14-AUG-2026', sup: 1005, rest: 2005, st: 'Pending' }
  ],
  order_item: [
    { id: 7001, oid: 6001, pid: 4001, qty: 100, cost: 8500 },
    { id: 7002, oid: 6002, pid: 4002, qty: 50, cost: 7250 },
    { id: 7003, oid: 6003, pid: 4003, qty: 40, cost: 4800 },
    { id: 7004, oid: 6004, pid: 4004, qty: 25, cost: 7000 },
    { id: 7005, oid: 6005, pid: 4005, qty: 20, cost: 7000 }
  ]
};

async function seed() {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log('Successfully connected to Oracle Database for seeding.');
    
    // Check tables
    const tables = ['SUPPLIER', 'RESTAURANT', 'WAREHOUSE', 'PRODUCT', 'INVENTORY', 'PURCHASE_ORDER', 'ORDER_ITEM'];
    for (const table of tables) {
      const res = await connection.execute(`SELECT table_name FROM user_tables WHERE table_name = :t`, [table]);
      if (res.rows.length === 0) {
        throw new Error(`Table ${table} does not exist. Please create the schema first.`);
      }
    }

    // Suppliers
    for (const s of seedData.supplier) {
      const check = await connection.execute('SELECT * FROM supplier WHERE supplier_id = :id', [s.id]);
      if (check.rows.length === 0) {
        await connection.execute(`INSERT INTO supplier (supplier_id, supplier_name, contact_no, city) VALUES (:1, :2, :3, :4)`, [s.id, s.name, s.contact, s.city]);
      } else {
        const row = check.rows[0];
        if (row.SUPPLIER_NAME !== s.name || row.CONTACT_NO !== s.contact || row.CITY !== s.city) {
          throw new Error(`Conflict for supplier ${s.id}. Data differs.`);
        }
      }
    }
    
    // Restaurants
    for (const r of seedData.restaurant) {
      const check = await connection.execute('SELECT * FROM restaurant WHERE restaurant_id = :id', [r.id]);
      if (check.rows.length === 0) {
        await connection.execute(`INSERT INTO restaurant (restaurant_id, restaurant_name, city, phone) VALUES (:1, :2, :3, :4)`, [r.id, r.name, r.city, r.phone]);
      } else {
        const row = check.rows[0];
        if (row.RESTAURANT_NAME !== r.name || row.CITY !== r.city || row.PHONE !== r.phone) {
          throw new Error(`Conflict for restaurant ${r.id}. Data differs.`);
        }
      }
    }
    
    // Warehouse
    for (const w of seedData.warehouse) {
      const check = await connection.execute('SELECT * FROM warehouse WHERE warehouse_id = :id', [w.id]);
      if (check.rows.length === 0) {
        await connection.execute(`INSERT INTO warehouse (warehouse_id, warehouse_name, city, capacity) VALUES (:1, :2, :3, :4)`, [w.id, w.name, w.city, w.cap]);
      } else {
        const row = check.rows[0];
        if (row.WAREHOUSE_NAME !== w.name || row.CITY !== w.city || row.CAPACITY !== w.cap) {
          throw new Error(`Conflict for warehouse ${w.id}. Data differs.`);
        }
      }
    }
    
    // Product
    for (const p of seedData.product) {
      const check = await connection.execute('SELECT * FROM product WHERE product_id = :id', [p.id]);
      if (check.rows.length === 0) {
        await connection.execute(`INSERT INTO product (product_id, product_name, category, unit_cost, supplier_id) VALUES (:1, :2, :3, :4, :5)`, [p.id, p.name, p.cat, p.cost, p.sup]);
      } else {
        const row = check.rows[0];
        if (row.PRODUCT_NAME !== p.name || row.CATEGORY !== p.cat || row.UNIT_COST !== p.cost || row.SUPPLIER_ID !== p.sup) {
          throw new Error(`Conflict for product ${p.id}. Data differs.`);
        }
      }
    }
    
    // Inventory
    for (const i of seedData.inventory) {
      const check = await connection.execute('SELECT * FROM inventory WHERE inventory_id = :id', [i.id]);
      if (check.rows.length === 0) {
        await connection.execute(`INSERT INTO inventory (inventory_id, product_id, warehouse_id, stock_qty, reorder_level) VALUES (:1, :2, :3, :4, :5)`, [i.id, i.prod, i.wh, i.qty, i.re]);
      } else {
        const row = check.rows[0];
        if (row.PRODUCT_ID !== i.prod || row.WAREHOUSE_ID !== i.wh || row.STOCK_QTY !== i.qty || row.REORDER_LEVEL !== i.re) {
          throw new Error(`Conflict for inventory ${i.id}. Data differs.`);
        }
      }
    }
    
    // Purchase Order
    for (const po of seedData.purchase_order) {
      const check = await connection.execute('SELECT * FROM purchase_order WHERE order_id = :id', [po.id]);
      if (check.rows.length === 0) {
        await connection.execute(`INSERT INTO purchase_order (order_id, order_date, supplier_id, restaurant_id, order_status) VALUES (:1, TO_DATE(:2, 'DD-MON-YYYY'), :3, :4, :5)`, [po.id, po.dt, po.sup, po.rest, po.st]);
      } else {
        const row = check.rows[0];
        if (row.SUPPLIER_ID !== po.sup || row.RESTAURANT_ID !== po.rest || row.ORDER_STATUS !== po.st) {
          throw new Error(`Conflict for purchase_order ${po.id}. Data differs.`);
        }
      }
    }
    
    // Order Item
    for (const oi of seedData.order_item) {
      const check = await connection.execute('SELECT * FROM order_item WHERE order_item_id = :id', [oi.id]);
      if (check.rows.length === 0) {
        await connection.execute(`INSERT INTO order_item (order_item_id, order_id, product_id, quantity, total_cost) VALUES (:1, :2, :3, :4, :5)`, [oi.id, oi.oid, oi.pid, oi.qty, oi.cost]);
      } else {
        const row = check.rows[0];
        if (row.ORDER_ID !== oi.oid || row.PRODUCT_ID !== oi.pid || row.QUANTITY !== oi.qty || row.TOTAL_COST !== oi.cost) {
          throw new Error(`Conflict for order_item ${oi.id}. Data differs.`);
        }
      }
    }
    
    await connection.commit();
    console.log('Seeding successful.');
    
  } catch (err) {
    console.error('Error during seeding:', err.message);
    if (connection) {
      try {
        await connection.rollback();
        console.log('Transaction rolled back.');
      } catch (e) {
        console.error('Error on rollback:', e.message);
      }
    }
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err.message);
      }
    }
  }
}

seed();
