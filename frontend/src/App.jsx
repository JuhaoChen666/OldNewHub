import { useState, useEffect } from 'react'

function App() {
  const [items, setItems] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState('list') // list, login, register, upload, admin

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = () => {
    fetch('/api/items/public/list')
      .then(res => res.json())
      .then(data => setItems(data))
  }

  const handleLogin = (e) => {
    e.preventDefault()
    // Using Basic Auth for simplicity in this prototype
    const authHeader = 'Basic ' + btoa(username + ':' + password)
    fetch('/api/auth/login-success', {
      headers: { 'Authorization': authHeader }
    }).then(res => {
      if (res.ok) {
        setIsLoggedIn(true)
        localStorage.setItem('auth', authHeader)
        setView('list')
      } else {
        alert('Login failed')
      }
    })
  }

  const handleRegister = (e) => {
    e.preventDefault()
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email: username + '@example.com' })
    }).then(res => {
      if (res.ok) {
        alert('Registered! Please login.')
        setView('login')
      } else {
        alert('Registration failed')
      }
    })
  }

  const handleUpload = (e) => {
    e.preventDefault()
    const title = e.target.title.value
    const price = e.target.price.value
    const description = e.target.description.value

    fetch('/api/items/upload', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('auth')
      },
      body: JSON.stringify({ title, price, description })
    }).then(res => {
      if (res.ok) {
        alert('Item uploaded and pending audit!')
        setView('list')
        fetchItems()
      }
    })
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>OldNewHub - Campus Trading</h1>
      <nav style={{ marginBottom: '20px' }}>
        <button onClick={() => setView('list')}>Browse</button>
        {!isLoggedIn ? (
          <>
            <button onClick={() => setView('login')}>Login</button>
            <button onClick={() => setView('register')}>Register</button>
          </>
        ) : (
          <>
            <button onClick={() => setView('upload')}>Upload Item</button>
            <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('auth'); }}>Logout</button>
          </>
        )}
      </nav>

      {view === 'list' && (
        <div>
          <h2>Available Items</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {items.map(item => (
              <div key={item.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <p><strong>Price: ¥{item.price}</strong></p>
                <button onClick={() => alert('Share link copied!')}>Share</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'login' && (
        <form onSubmit={handleLogin}>
          <h2>Login</h2>
          <input placeholder="Username" onChange={e => setUsername(e.target.value)} /><br/>
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} /><br/>
          <button type="submit">Login</button>
        </form>
      )}

      {view === 'register' && (
        <form onSubmit={handleRegister}>
          <h2>Register</h2>
          <input placeholder="Username" onChange={e => setUsername(e.target.value)} /><br/>
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} /><br/>
          <button type="submit">Register</button>
        </form>
      )}

      {view === 'upload' && (
        <form onSubmit={handleUpload}>
          <h2>Upload Item</h2>
          <input name="title" placeholder="Item Title" required /><br/>
          <input name="price" type="number" placeholder="Price" required /><br/>
          <textarea name="description" placeholder="Description"></textarea><br/>
          <button type="submit">Submit for Audit</button>
        </form>
      )}
    </div>
  )
}

export default App
