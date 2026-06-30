# TODO — MyHealthMate MongoDB + Local Output Link

## Step 1: Verify MongoDB connection behavior
- Ensure backend uses real MongoDB (MONGODB_URI)
- Confirm default URI format and database name

## Step 2: Add/confirm server .env config
- Create server/.env with MONGODB_URI pointing to local Mongo
- (Optional) set JWT_SECRET

## Step 3: Start backend + frontend
- Run `npm install` if needed
- Start server (http://localhost:5000)
- Start client (http://localhost:5173)

## Step 4: Verify MongoDB Compass connection
- Provide a Compass connection string that matches MONGODB_URI
- Confirm collections are created by app actions

## Step 5: Provide local output link
- Provide frontend URL for the running app
- Provide backend URL + health endpoint

