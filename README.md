# Contact + Messaging System

This is a high-performance backend system developed using **Node.js + Express** and **PostgreSQL**. It manages a large-scale contact and messaging database with support for:

- Efficient seeding of 100,000 contacts and 5 million messages
- Optimized queries to retrieve the 50 most recent conversations
- Full pagination
- Search across contact name, phone number, and message content
- PowerShell scripts for quick command-line testing

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Tools**: Faker.js, pg, PowerShell, readline, curl

---

## 🚀 Features

- 🔄 Retrieve the 50 most recent conversations (last message per contact)
- 🔍 Search conversations by:
  - Contact name
  - Phone number
  - Message content
- 📄 Pagination support
- ⚡ Performance-optimized indexes
- 🧪 Shell and PowerShell scripts for fast testing

---

## 🧰 System Requirements & Design Notes

### ✅ System Requirements

- Node.js v18+ (tested with Node 20)
- PostgreSQL 13+
- PowerShell 5+ (for running `.ps1` helper scripts)
- Git Bash or any terminal with support for `curl` (optional)

---

### ✅ Assumptions Made

- Each "conversation" is defined by the **most recent message per contact** (to or from the contact).
- `seed.js` only works on message file contains **plain text**, one message per line.
- Contact phone numbers are generated as **unique**, random Singapore-style numbers using Faker.
- Message timestamps are randomly distributed over the **last 30 days**.
- No authentication or authorization is required — the backend is open for querying.

---

### ✅ Key Design Decisions

- **PostgreSQL** was used exclusively to meet the test constraints, and to leverage `DISTINCT ON` + indexing for high-performance queries.
- **Node.js with Express** was chosen for simplicity, speed of development, and adherence to test requirements.
- **Batch seeding (1,000 rows per insert)** was used to handle millions of rows efficiently without running into memory or timeout issues.
- PowerShell scripts were added for ease of local testing and quick API exploration in CLI environments.
- Table and index creation is **idempotent** (`IF NOT EXISTS`) to support reruns of the setup script.

---

## 📦 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/contact-express.git
cd contact-express
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create PostgreSQL Database
Using `psql` or pgAdmin:
```sql
CREATE DATABASE exabloom;
```

### 4. Configure `.env`
Create a `.env` file in the root, replacing your_username, your_password, your_host with your actual postgreSQL username, password and host.
```
DATABASE_URL=postgresql://your_username:your_password@localhost:your_host/exabloom
```

### 5. Create Tables and Indexes

Run the provided `init.sql` file to set up your database schema and indexes.

#### Option A: Using `psql`

```bash
psql -U your_username -d exabloom -f db/init.sql
```

#### Option B: Using pgAdmin
1. Open your exabloom database in pgAdmin.
2. Open the Query Tool.
3. Open and run db/init.sql.

This will create:
* contacts and messages tables
* Required indexes for performance optimization

### 6. Prepare the Message Content
Download [`message_content.csv`](https://drive.google.com/file/d/1hwQyxSSYU5dhBjjZSbRiGC0QDafnLqyZ/view?usp=sharing) and place it in
```
/data/message_content.csv
```

### 7. Seed the Database
This inserts 100,000 contacts and 5 million messages.
```
node scripts/seed.js
```
You can adjust the numbers in seed.js for faster testing.

### 8. Run the server
```
node app.js
```
Server runs on:
👉 http://localhost:3000

### 9. Queries installed

#### Get 50 Most Recent Conversations

##### Using `curl`
```
curl "http://localhost:3000/api/page"
```
* Make a table
```
curl "http://localhost:3000/api/page" | ConvertFrom-Json | Format-Table
```
* Getting the subsequent 50 pages: pagination functionality
```
curl "http://localhost:3000/api/page?page={your_page_num}" | ConvertFrom-Json | Format-Table
```
Replace `{your_page_num}` with the desired page, i.e. 
```
curl "http://localhost:3000/api/page?page=2" | ConvertFrom-Json | Format-Table
```
##### Using PowerShell Scripts
```powershell
.\convo.ps1 {page_number}
```
e.g. `.\convo.ps1 2` for page 2

#### Search Value by based on contact name, phone number, or message content

##### Using `curl`
```
curl "http://localhost:3000/api/search?searchValue={your_search_value}&page={your_page}"
```
Replace `{your_search_value}` and `{your_page}` with the desired search value and the page number to search on
e.g.
```
curl "http://localhost:3000/api/search?searchValue=alex&page=2"
```

* Make a table
```
curl "http://localhost:3000/api/search?searchValue={your_search_value}&page={your_page}" | ConvertFrom-Json | Format-Table
```

##### Using PowerShell Scripts
* Use PowerShell Scripts
```powershell
.\search.ps1 "{your_value}" {your_page}
```
e.g. `.\search.ps1 "alex" 2` to search for `alex` in page 2.