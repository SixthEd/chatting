-- Create tables in chattwo

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE userfriends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE userchat (
    id SERIAL PRIMARY KEY,
    "from" INTEGER NOT NULL,
    "to" INTEGER NOT NULL,
    message TEXT NOT NULL,
    send_at TIME NOT NULL,
    date DATE NOT NULL,
    FOREIGN KEY ("from") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("to") REFERENCES users(id) ON DELETE CASCADE
);
