# Database Design

## ER Diagram Description
[Description of entities and relationships, e.g., One User has Many Posts]

## Schema Definition (SQL)
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title VARCHAR(200),
    content TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);