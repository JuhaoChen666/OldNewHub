import { useState, useEffect } from 'react'

function App() {
  const [items, setItems] = useState([])
  const [myItems, setMyItems] = useState([])
  const [dashboardData, setDashboardData] = useState({
    activeItemsCount: 0,
    totalFavorites: 0,
    totalSales: 0,
    announcements: []
  })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState('home') // home, list, login, register, upload, dashboard, my-market        
  const [selectedImages, setSelectedImages] = useState([])

  useEffect(() => {

    window.scrollTo(0, 0)
    if (view === 'dashboard' && (isLoggedIn || localStorage.getItem('auth'))) {
      fetchDashboardData()
    }
    if (view === 'my-market' && (isLoggedIn || localStorage.getItem('auth'))) {
      fetchMyItems()
    }
  }, [view])

  useEffect(() => {
    fetchItems()
    const storedAuth = localStorage.getItem('auth')
    if (storedAuth) {
      setIsLoggedIn(true)
      // If we're already logged in, set view to dashboard and fetch data
      setView('dashboard')
    }
  }, [])

  const fetchItems = () => {
    fetch('/api/items/public/list')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error("Fetch error:", err))
  }

  const fetchMyItems = () => {
    const authHeader = localStorage.getItem('auth')
    if (!authHeader) return

    fetch('/api/items/mine', {
      headers: { 'Authorization': authHeader }
    })
      .then(res => res.json())
      .then(data => setMyItems(data))
      .catch(err => console.error("Fetch my items error:", err))
  }

  const handleUpdateStatus = (id, newStatus) => {
    const authHeader = localStorage.getItem('auth')
    fetch(`/api/items/${id}/status?status=${newStatus}`, {
      method: 'PUT',
      headers: { 'Authorization': authHeader }
    }).then(res => {
      if (res.ok) {
        fetchMyItems()
      } else {
        alert('Update failed')
      }
    })
  }

  const handleUpdatePrice = (id) => {
    const newPrice = prompt('请输入新价格:')
    if (newPrice === null || newPrice === '') return
    
    const authHeader = localStorage.getItem('auth')
    fetch(`/api/items/${id}/price?price=${newPrice}`, {
      method: 'PUT',
      headers: { 'Authorization': authHeader }
    }).then(res => {
      if (res.ok) {
        fetchMyItems()
      } else {
        alert('Update failed')
      }
    })
  }

  const fetchDashboardData = () => {
    const authHeader = localStorage.getItem('auth')
    if (!authHeader) return

    fetch('/api/dashboard/stats', {
      headers: { 'Authorization': authHeader }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch dashboard')
        return res.json()
      })
      .then(data => {
        // Ensure announcements is always an array
        if (data && !data.announcements) data.announcements = []
        setDashboardData(data)
      })
      .catch(err => {
        console.error("Dashboard fetch error:", err)
        // If unauthorized, might want to logout
        if (err.message.includes('401')) {
           localStorage.removeItem('auth')
           setIsLoggedIn(false)
           setView('login')
        }
      })
  }

  const handleLogin = (e) => {
    e.preventDefault()
    try {
      // Use encodeURIComponent + unescape for UTF-8 support in btoa
      const authHeader = 'Basic ' + btoa(unescape(encodeURIComponent(username + ':' + password)))
      fetch('/api/auth/login-success', {
        headers: { 'Authorization': authHeader }
      }).then(res => {
        if (res.ok) {
          setIsLoggedIn(true)
          localStorage.setItem('auth', authHeader)
          localStorage.setItem('username', username)
          setView('dashboard')
        } else {
          alert('Login failed: Invalid username or password')
        }
      }).catch(err => {
        console.error("Login request error:", err)
        alert('Network error or server is down')
      })
    } catch (err) {
      console.error("Auth encoding error:", err)
      alert('Login failed: Character encoding error')
    }
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

  const handleBrowse = () => {
    if (isLoggedIn || localStorage.getItem('auth')) {
      setView('list')
    } else {
      setView('login')
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + selectedImages.length > 3) {
      alert('最多上传3张图片')
      return
    }
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} 超过10MB限制`)
        return false
      }
      return true
    })
    
    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    setSelectedImages([...selectedImages, ...newImages])
  }

  const removeImage = (index) => {
    const newImages = [...selectedImages]
    URL.revokeObjectURL(newImages[index].preview)
    newImages.splice(index, 1)
    setSelectedImages(newImages)
  }

  const handleUpload = (e) => {
    e.preventDefault()
    const formData = new FormData()
    const item = {
      title: e.target.title.value,
      price: e.target.price.value,
      description: e.target.description.value
    }
    
    formData.append('item', new Blob([JSON.stringify(item)], { type: 'application/json' }))
    selectedImages.forEach(img => {
      formData.append('images', img.file)
    })

    fetch('/api/items/upload', {
      method: 'POST',
      headers: { 
        'Authorization': localStorage.getItem('auth')
      },
      body: formData
    }).then(res => {
      if (res.ok) {
        alert('物品已提交审核！')
        setSelectedImages([])
        setView('list')
        fetchItems()
      } else {
        alert('上传失败')
      }
    })
  }

  return (
    <div className={`app-container ${(view === 'login' || view === 'register') ? 'auth-page' : ''}`}>
      {/* Section 1: Navbar */}
      <nav className={`nav-container ${(view === 'login' || view === 'register') ? 'nav-center' : ''}`}>
        <div className="logo" onClick={() => setView('home')}>OldNewHub</div>
        {!(view === 'login' || view === 'register') && (
          <div className="nav-buttons">
            {!isLoggedIn ? (
              <>
                <button className="btn-primary" onClick={() => setView('login')}>登录</button>
                <button className="btn-primary" onClick={() => setView('register')}>注册</button>
              </>
            ) : (
              <>
                <button className="btn-outline" onClick={() => setView('dashboard')}>个人中心</button>
                <button className="btn-outline" onClick={() => setView('list')}>广场</button>
                <button className="btn-outline" onClick={() => setView('my-market')}>我的市场</button>
                <button className="btn-primary" onClick={() => { setIsLoggedIn(false); localStorage.removeItem('auth'); setView('home'); }}>登出</button>
              </>
            )}
          </div>
        )}
      </nav>

      {view === 'home' && (
        <main key="home" className="fade-in">
          {/* Section 2: Hero */}
          <section className="hero">
            <div className="hero-content">
              <h1 className="hero-title">连接校园，让闲置转动起来</h1>
              <p className="hero-subtitle">
                OldNewHub 是专为校园设计的二手交易平台。在这里，你可以轻松转让你的闲置物品，也可以发现学长学姐留下的宝藏。
              </p>
              <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }} onClick={handleBrowse}>
                Browse
              </button>
            </div>
            <div className="hero-visual">
              <div className="mockup-card">
                <div className="mockup-img-placeholder"></div>
                <div className="mockup-line" style={{ width: '80%' }}></div>
                <div className="mockup-line" style={{ width: '60%' }}></div>
                <div className="mockup-line" style={{ width: '40%', marginTop: '20px', backgroundColor: '#4f46e5' }}></div>
              </div>
            </div>
          </section>

          {/* Section 3: Features */}
          <section className="features-container">
            <h2 className="section-title">为什么选择 OldNewHub?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎓</div>
                <h3>校内专享</h3>
                <p>仅限本校学生和教职工使用，身份更透明，交易更安全。</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>极速发布</h3>
                <p>简单的发布流程，一分钟即可让你的闲置物品上线展示。</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🤝</div>
                <h3>线下交易</h3>
                <p>支持校内当面验货交易，省去快递烦恼，信任触手可及。</p>
              </div>
            </div>
          </section>
        </main>
      )}

      <div className="content-area">
        {view === 'dashboard' && (
          <div key="dashboard" className="fade-in dashboard-container">
            <section className="welcome-banner">
              <h1>欢迎回来, {localStorage.getItem('username') || '同学'}!</h1>
              <p>今天想发现点什么好物，还是让你的闲置重新发光？</p>
            </section>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{dashboardData.activeItemsCount}</span>
                <span className="stat-label">在售物品</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{dashboardData.totalFavorites}</span>
                <span className="stat-label">收到收藏</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">¥{dashboardData.totalSales}</span>
                <span className="stat-label">累计成交额</span>
              </div>
            </div>

            <div className="action-section">
              <div className="recent-activity">
                <h3 style={{ marginBottom: '1.5rem' }}>系统公告 & 推荐</h3>
                {dashboardData.announcements.length > 0 ? dashboardData.announcements.map(ann => (
                  <div key={ann.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', marginBottom: '1rem' }}>
                    <p style={{ fontWeight: '600', color: ann.type === 'NOTICE' ? 'var(--primary-color)' : '#ec4899' }}>
                      {ann.type === 'NOTICE' ? '📢' : '🔥'} {ann.title}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{ann.content}</p>
                  </div>
                )) : (
                  <p style={{ color: '#64748b' }}>暂无公告</p>
                )}
              </div>

              <div className="quick-links">
                <h3 style={{ marginBottom: '1rem' }}>快捷操作</h3>
                <div className="link-card" onClick={() => setView('upload')}>
                  <div className="link-icon">📤</div>
                  <div>
                    <div style={{ fontWeight: '600' }}>发布闲置</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>简单三步快速变现</div>
                  </div>
                </div>
                <div className="link-card" onClick={() => setView('list')}>
                  <div className="link-icon">🔍</div>
                  <div>
                    <div style={{ fontWeight: '600' }}>探索好物</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>看看大家都在卖什么</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'my-market' && (
          <div key="my-market" className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0 }}>我的市场</h2>
              <button className="btn-primary" onClick={() => setView('upload')}>发布闲置</button>
            </div>
            <div className="items-grid">
              {myItems.length > 0 ? myItems.map(item => (
                <div key={item.id} className="item-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3>{item.title}</h3>
                    <span className={`status-badge status-${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </div>
                  {item.images && item.images.length > 0 && (
                    <img src={item.images[0].imageUrl} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} alt={item.title} />
                  )}
                  <p style={{ color: '#64748b', fontSize: '0.9rem', height: '3em', overflow: 'hidden' }}>{item.description}</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4f46e5', margin: '1rem 0' }}>¥{item.price}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn-outline" onClick={() => handleUpdatePrice(item.id)}>改价</button>
                    {item.status === 'REMOVED' ? (
                      <button className="btn-outline" onClick={() => handleUpdateStatus(item.id, 'APPROVED')}>上架</button>
                    ) : (
                      <button className="btn-outline" onClick={() => handleUpdateStatus(item.id, 'REMOVED')}>下架</button>
                    )}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '16px' }}>
                  <p style={{ color: '#64748b', marginBottom: '1rem' }}>你还没有上传任何物品</p>
                  <button className="btn-primary" onClick={() => setView('upload')}>立即去发布</button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'list' && (
          <div key="list" className="fade-in">
            <h2 style={{ marginBottom: '2rem' }}>精选好物</h2>
            <div className="items-grid">
              {items.length > 0 ? items.map(item => (
                <div key={item.id} className="item-card">
                  {item.images && item.images.length > 0 && (
                    <img src={item.images[0].imageUrl} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} alt={item.title} />
                  )}
                  <h3>{item.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', height: '3em', overflow: 'hidden' }}>{item.description}</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4f46e5', margin: '1rem 0' }}>¥{item.price}</p>
                  <button className="btn-outline" style={{ width: '100%' }} onClick={() => alert('分享链接已复制')}>分享</button>
                </div>
              )) : (
                <p>暂无物品，快去上传一个吧！</p>
              )}
            </div>
          </div>
        )}

        {view === 'login' && (
          <form key="login" className="fade-in" onSubmit={handleLogin}>
            <h2>欢迎回来</h2>
            <input placeholder="用户名" required onChange={e => setUsername(e.target.value)} />
            <input type="password" placeholder="密码" required onChange={e => setPassword(e.target.value)} />
            <button className="btn-primary" style={{ width: '100%' }} type="submit">登录</button>
            <button className="back-btn" type="button" onClick={() => setView('home')}>返回首页</button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
              还没有账号？ <a href="#" onClick={() => setView('register')}>立即注册</a>
            </p>
          </form>
        )}

        {view === 'register' && (
          <form key="register" className="fade-in" onSubmit={handleRegister}>
            <h2>加入 OldNewHub</h2>
            <input placeholder="用户名" required onChange={e => setUsername(e.target.value)} />
            <input type="password" placeholder="密码" required onChange={e => setPassword(e.target.value)} />
            <button className="btn-primary" style={{ width: '100%' }} type="submit">注册</button>
            <button className="back-btn" type="button" onClick={() => setView('home')}>返回首页</button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
              已有账号？ <a href="#" onClick={() => setView('login')}>去登录</a>
            </p>
          </form>
        )}

        {view === 'upload' && (
          <form key="upload" className="fade-in" onSubmit={handleUpload}>
            <h2>发布闲置</h2>
            <input name="title" placeholder="物品名称" required />
            <input name="price" type="number" placeholder="期望价格 (¥)" required />
            <textarea name="description" placeholder="描述一下你的宝贝（品牌、成色、转手原因等）" rows="4"></textarea>
            
            <div className="upload-section" style={{ margin: '1rem 0' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>添加图片 (最多3张，每张<10MB)</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {selectedImages.map((img, index) => (
                  <div key={index} style={{ position: 'relative', width: '100px', height: '100px' }}>
                    <img src={img.preview} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    <button 
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >×</button>
                  </div>
                ))}
                {selectedImages.length < 3 && (
                  <label style={{ 
                    width: '100px', 
                    height: '100px', 
                    border: '2px dashed #cbd5e1', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer',
                    fontSize: '2rem',
                    color: '#94a3b8'
                  }}>
                    +
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%' }} type="submit">确认发布</button>
            <button className="back-btn" type="button" onClick={() => setView('home')}>取消发布</button>
          </form>
        )}
      </div>

      {/* Section 4: Footer */}
      <footer>
        <p>© 2026 OldNewHub. All rights reserved.</p>
        <p style={{ marginTop: '0.5rem' }}>创作者：Marsco</p>
      </footer>
    </div>
  )
}

export default App
