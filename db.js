require('dotenv').config();
const { Pool } = require('pg');

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.DB_URL
});

// Export the pool for use in your application
module.exports = pool;

const createUsers = async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
  
    try {
      await pool.query(query);
      console.log('Table "users" created successfully');
      createCategories(); // dropCategories();
    } catch (err) {
      console.error('Error creating table:', err);
    } finally {
    //   await pool.end();
    }
  };
  
  createUsers();

  // const dropCategories = async () => {
  //   const query = `
  //     Drop TABLE categories
  //   `;

  //   try {
  //     await pool.query(query);
  //     console.log('Table "categories" droped successfully');
  //     createCategories();
  //   } catch (err) {
  //     console.error('Error droping table:', err.message);
  //   } finally {
  //   //   await pool.end();
  //   }
  // };


  const createCategories = async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL
      );
    `;
  
    try {
      await pool.query(query);
      console.log('Table "categories" created successfully');
      createPets(); //fillCategories();
    } catch (err) {
      console.error('Error creating table:', err.message);
    } finally {
    //   await pool.end();
    }
  };


  // const fillCategories = async () => {
  //   const query = `
  //     INSERT INTO categories (name) 
  //       VALUES 
  //        ('Кіт'),
  //        ('Пес'),
  //        ('Риба'),
  //        ('Жаба'),
  //        ('Змія'),
  //        ('Ящірка'),
  //        ('Папуг');
  //   `;
  
  //   try {
  //     await pool.query(query);
  //     console.log('Table "categories" filled successfully');
  //     createPets();
  //   } catch (err) {
  //     console.error('Error filling table:', err.message);
  //   } finally {
  //   //   await pool.end();
  //   }
  // };


  const createPets = async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS pets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          category_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          price DECIMAL NOT NULL,
          description TEXT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE

      );
    `;
  
    try {
      await pool.query(query);
      console.log('Table "pets" created successfully');
    } catch (err) {
      console.error('Error creating table:', err.message);
    } finally {
    //   await pool.end();
    }
  };





//   const newUser = async () => {
// const query = `
//   INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
//   VALUES ($1, $2, $3, $4, NOW(), NOW())
//   ON CONFLICT (id)
//   DO UPDATE SET 
//     name = EXCLUDED.name,
//     email = EXCLUDED.email,
//     password_hash = EXCLUDED.password_hash,
//     updated_at = NOW()
//   RETURNING *;
// `;

// const userData = {
//   id: 1,
//   name: 'Peter',
//   email: 'NotFakePeter@gmail.com',
//   password_hash: 'hashed_password_123',
// };

//   try {
//     const result = await pool.query(query, [
//       userData.id,
//       userData.name,
//       userData.email,
//       userData.password_hash,
//     ]);
//     console.log(result.rows[0]);
//   } catch (err) {
//     console.log('Error registering user:', err.message);
//   }
// };

// newUser();