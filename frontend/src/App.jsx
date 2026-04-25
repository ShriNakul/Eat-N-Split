import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [friends, setFriends] = useState([]);
  const [newName, setNewName] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [bill, setBill] = useState("");
  const [whoIsPaying, setWhoIsPaying] = useState("user");
  const [showAddFriend, setShowAddFriend] = useState(false);

  // 1. Fetch friends on load
  useEffect(() => {
    fetch("/api/friends")
      .then((res) => res.json())
      .then(setFriends);
  }, []);

  // 2. Add a new friend
  async function handleAddFriend(e) {
    e.preventDefault();
    if (!newName) return;

    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    if (res.ok) {
      const newFriend = await res.json();
      setFriends([...friends, newFriend]);
      setNewName("");
      setShowAddFriend(false);
    }
  }

  // 3. Remove a friend
  async function handleRemoveFriend(id) {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;

    const res = await fetch(`/api/friends/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setFriends(friends.filter((f) => f.id !== id));
      if (selectedFriend?.id === id) setSelectedFriend(null);
    }
  }

  // 4. Split the bill logic
  async function handleSplitBill(e) {
    e.preventDefault();
    if (!bill || !selectedFriend) return;

    const amount = Number(bill) / 2;
    const adjustment = whoIsPaying === "user" ? amount : -amount;

    const res = await fetch(`/api/friends/${selectedFriend.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustment }),
    });

    if (res.ok) {
      const updatedFriend = await res.json();
      setFriends(
        friends.map((f) => (f.id === updatedFriend.id ? updatedFriend : f)),
      );
      setBill("");
      setSelectedFriend(null);
    }
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h1>Eat-N-Split</h1>

        <ul className="friend-list">
          {friends.map((f) => (
            <li key={f.id} className="friend-item">
              <button
                className="btn-delete"
                onClick={() => handleRemoveFriend(f.id)}
              >
                ✖
              </button>

              <div className="friend-name">{f.name}</div>

              <div
                className={`friend-balance ${
                  f.balance > 0
                    ? "positive"
                    : f.balance < 0
                      ? "negative"
                      : "even"
                }`}
              >
                {f.balance > 0 && `${f.name} owes you $${f.balance}`}
                {f.balance < 0 && `You owe ${f.name} $${Math.abs(f.balance)}`}
                {f.balance === 0 && `You and ${f.name} are even`}
              </div>

              <button
                className="btn-select"
                onClick={() =>
                  setSelectedFriend(selectedFriend?.id === f.id ? null : f)
                }
              >
                {selectedFriend?.id === f.id ? "Close" : "Select"}
              </button>
            </li>
          ))}
        </ul>

        {showAddFriend ? (
          <form onSubmit={handleAddFriend} className="form-add-friend">
            <input
              type="text"
              placeholder="Friend Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="submit" className="btn-orange">
              Add
            </button>
            <button
              type="button"
              className="btn-link"
              onClick={() => setShowAddFriend(false)}
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            className="btn-orange btn-full"
            onClick={() => setShowAddFriend(true)}
          >
            Add Friend
          </button>
        )}
      </div>

      {selectedFriend && (
        <div className="form-split-bill">
          <h2>Split a bill with {selectedFriend.name}</h2>
          <form onSubmit={handleSplitBill}>
            <div className="input-group">
              <label>💰 Total Bill Value</label>
              <input
                type="number"
                value={bill}
                onChange={(e) => setBill(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>💳 Who is paying?</label>
              <select
                value={whoIsPaying}
                onChange={(e) => setWhoIsPaying(e.target.value)}
              >
                <option value="user">You</option>
                <option value="friend">{selectedFriend.name}</option>
              </select>
            </div>

            <button type="submit" className="btn-orange">
              Split Bill
            </button>
            <button
              type="button"
              className="btn-link"
              onClick={() => setSelectedFriend(null)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
