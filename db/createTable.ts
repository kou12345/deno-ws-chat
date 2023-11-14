import { db } from "./db.ts";

// テーブルの存在を確認して、存在する場合は削除する関数
async function createTable(tableName: string, createStatement: string) {
  const checkTableExist = await db.execute(`SHOW TABLES LIKE '${tableName}'`);
  if (checkTableExist.size > 0) {
    await db.execute(`DROP TABLE ${tableName}`);
  }
  await db.execute(createStatement);
}

// rooms テーブルを作成
await createTable(
  "rooms",
  `
  CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`
);

// messages テーブルを作成
await createTable(
  "messages",
  `
  CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    message_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`
);
