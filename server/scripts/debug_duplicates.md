# duplicate_email_investigation

## Issue

User reports "Duplicate value entered for email" error despite dropping the index.

## Investigation Steps

1. Checked `User.js`: `unique: true` IS REMOVED.
2. Checked `adminController.js`: Manual check IS REMOVED.
3. Ran `dropEmailIndex.js` again: Confirmed `email_1` is NOT present.

## Finding

The logic seems correct. The index is gone. The schema is updated.
However, the error `Duplicate value entered for email` comes from my **custom error handler** in `adminController.js`.

```javascript
if (error.code === 11000) {
  // Duplicate key error
  const field = Object.keys(error.keyPattern)[0];
  return res
    .status(400)
    .json({
      message: `Duplicate value entered for ${field}. If this is 'email', the database still has a unique constraint.`,
    });
}
```

If this is triggering, it means MongoDB **IS** throwing code 11000 (Duplicate Key).
This implies an index **DOES** exist.

But `dropEmailIndex.js` says:

```
Current Indexes: [
  { v: 2, key: { _id: 1 }, name: '_id_' },
  {
    v: 2,
    key: { username: 1 },
    name: 'username_1',
    background: true,
    unique: true
  }
]
```

There is NO email index here.

## Possibility

Is it possible the error is coming from `username`?
If the user is trying to create a user with a **duplicate username** but a new email?
The error message I added: `Duplicate value entered for ${field}`.
If `field` is `username`, it would say "Duplicate value entered for username".
But the user specifically said: "Duplicate value entered for email".

## Another Possibility

Phantom index or different collection?
We are connecting to `exam_app`. `users` collection.
Maybe Mongoose created a **compound index**?
No, `indexes()` should list all of them.

## Action

I'll create a small script to **insert a duplicate user directly** via Mongoose script to verify if it fails outside the API.
This isolates whether it's the DB or the API/Controller.
