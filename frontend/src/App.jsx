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
  const [email, setEmail] = useState('')
  const [view, setView] = useState('home') // home, list, login, register, upload, dashboard, my-market, admin-audit
  const [selectedImages, setSelectedImages] = useState([])
  const [pendingItems, setPendingItems] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [buyDialogItem, setBuyDialogItem] = useState(null)
  const [buyMessage, setBuyMessage] = useState('')
  const [isSendingBuyRequest, setIsSendingBuyRequest] = useState(false)

  const CATEGORIES = [
    { id: 1, name: '图书' },
    { id: 2, name: '电子产品' },
    { id: 3, name: '生活用品' },
    { id: 4, name: '运动器材' },
    { id: 5, name: '其它' },
  ]

  useEffect(() => {
    window.scrollTo(0, 0)
    if (view === 'list') {
      fetchItems(categoryFilter)
    }
    if (view === 'dashboard' && (isLoggedIn || localStorage.getItem('auth'))) {
      fetchDashboardData()
    }
    if (view === 'my-market' && (isLoggedIn || localStorage.getItem('auth'))) {
      fetchMyItems()
    }
    if (view === 'admin-audit') {
      fetchPendingItems()
    }
  }, [view])

  useEffect(() => {
    fetchItems()
    const storedAuth = localStorage.getItem('auth')
    if (storedAuth) {
      setIsLoggedIn(true)
      if (localStorage.getItem('role') === 'ADMIN') {
        setIsAdmin(true)
      }
      setView('dashboard')
    }
  }, [])

  const fetchItems = (categoryId = null) => {
    let url = '/api/items/public/list'
    if (categoryId) {
      url += '?categoryId=' + categoryId
    }
    fetch(url)
      .then(async res => {
        if (!res.ok) {
          const errText = await res.text().catch(() => 'Unknown error')
          throw new Error(`HTTP ${res.status}: ${errText}`)
        }
        return res.json()
      })
      .then(data => setItems(data))
      .catch(err => console.error("Fetch items error:", err))
  }

  const fetchPendingItems = () => {
    const authHeader = localStorage.getItem('auth')
    if (!authHeader) return

    fetch('/api/items/admin/all', {
      headers: { 'Authorization': authHeader }
    })
      .then(res => res.json())
      .then(data => {
        const pending = data.filter(item => item.status === 'PENDING')
        setPendingItems(pending)
      })
      .catch(err => console.error("Fetch pending items error:", err))
  }

  const handleAudit = (id, newStatus) => {
    const authHeader = localStorage.getItem('auth')
    fetch(`/api/items/${id}/status?status=${newStatus}`, {
      method: 'PUT',
      headers: { 'Authorization': authHeader }
    }).then(res => {
      if (res.ok) {
        alert(newStatus === 'APPROVED' ? '审核已通过' : '已下架')
        fetchPendingItems()
        if (currentPage >= pendingItems.length - 1 && currentPage > 0) {
          setCurrentPage(currentPage - 1)
        }
      } else {
        alert('操作失败')
      }
    })
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
    }).then(async res => {
      if (res.ok) {
        fetchMyItems()
      } else {
        const error = await res.json().catch(() => ({ error: 'Update failed' }))
        alert('操作失败: ' + (error.error || '请稍后重试'))
      }
    }).catch(err => {
      console.error("Update status error:", err)
      alert('网络错误，请稍后重试')
    })
  }

  const handleUpdatePrice = (id, currentPrice) => {
    const newPriceStr = prompt('请输入新价格:')
    if (newPriceStr === null || newPriceStr === '') return

    const newPrice = parseFloat(newPriceStr)
    if (isNaN(newPrice) || newPrice <= 0) {
      alert('请输入有效的正数价格')
      return
    }

    let reason = ''
    const currentPriceNum = parseFloat(currentPrice)
    if (currentPriceNum > 0) {
      const changePercent = Math.abs(newPrice - currentPriceNum) / currentPriceNum
      if (changePercent > 0.25) {
        const percentDisplay = (changePercent * 100).toFixed(1)
        reason = prompt(`价格变动 ${percentDisplay}%，超过25%需要说明理由才能重新审核:\n(例如：降价促销、物品有瑕疵等)`)
        if (reason === null) return
        if (reason.trim() === '') {
          alert('价格变动超过25%必须说明理由，操作已取消')
          return
        }
      }
    }

    const authHeader = localStorage.getItem('auth')
    let url = `/api/items/${id}/price?price=${newPrice}`
    if (reason) url += '&reason=' + encodeURIComponent(reason.trim())

    fetch(url, {
      method: 'PUT',
      headers: { 'Authorization': authHeader }
    }).then(async res => {
      if (res.ok) {
        const data = await res.json()
        if (data.needsReview) {
          alert('价格变动超过25%，物品已重新提交审核，请等待管理员审核通过')
        }
        fetchMyItems()
      } else {
        const error = await res.json().catch(() => ({ error: 'Update failed' }))
        alert('改价失败: ' + (error.error || '请稍后重试'))
      }
    }).catch(err => {
      console.error("Update price error:", err)
      alert('网络错误，请稍后重试')
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
           localStorage.removeItem('role')
           localStorage.removeItem('username')
           setIsLoggedIn(false)
           setIsAdmin(false)
           setView('login')
        }
      })
  }

  const handleLogin = (e) => {
    e.preventDefault()
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(async res => {
      if (res.ok) {
        const data = await res.json()
        setIsLoggedIn(true)
        localStorage.setItem('auth', data.token)
        localStorage.setItem('username', data.username)
        localStorage.setItem('role', data.role)
        if (data.role === 'ADMIN') {
          setIsAdmin(true)
        }
        setView('dashboard')
      } else {
        const error = await res.json().catch(() => ({ error: 'Invalid credentials' }))
        alert('Login failed: ' + (error.error || 'Invalid username or password'))
      }
    }).catch(err => {
      console.error("Login request error:", err)
      alert('Network error or server is down')
    })
  }

  const handleRegister = (e) => {
    e.preventDefault()
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    }).then(async res => {
      if (res.ok) {
        alert('Registered! Please login.')
        setView('login')
      } else {
        const error = await res.json().catch(() => ({ error: 'Registration failed' }))
        alert('Registration failed: ' + (error.error || 'Unknown error'))
      }
    }).catch(err => {
      console.error("Register request error:", err)
      alert('Network error or server is down')
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
    
    // Check if ANY file exceeds the limit
    const overLimit = files.find(file => file.size > 10 * 1024 * 1024)
    if (overLimit) {
      alert(`图片 "${overLimit.name}" 超过10MB限制，请压缩后重试`)
      return
    }
    
    const newImages = files.map(file => ({
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
    
    // Final sanity check on image sizes
    const overLimit = selectedImages.find(img => img.file.size > 10 * 1024 * 1024)
    if (overLimit) {
      alert(`无法发布：图片 "${overLimit.file.name}" 超过 10MB 限制`)
      return
    }

    const formData = new FormData()
    const item = {
      title: e.target.title.value,
      price: e.target.price.value,
      tradeAddress: e.target.tradeAddress.value,
      description: e.target.description.value,
      category: { categoryId: parseInt(e.target.category.value) }
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
    }).then(async res => {
      if (res.ok) {
        alert('物品已提交审核！')
        setSelectedImages([])
        setView('list')
        fetchItems()
      } else {
        let errorMsg = '服务器响应异常'
        try {
          const contentType = res.headers.get("content-type")
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const errorData = await res.json()
            errorMsg = errorData.message || errorData.error || errorMsg
          } else {
            errorMsg = await res.text() || errorMsg
          }
        } catch (e) {
          console.error("Parse error info failed", e)
        }

        // Friendly mapping for common HTTP status codes
        if (res.status === 415) errorMsg = '不支持的文件类型，请上传图片文件'
        else if (res.status === 413) errorMsg = '文件太大，超过服务器限制'
        else if (res.status === 403) errorMsg = '权限不足，请重新登录'
        
        alert('上传失败: ' + errorMsg)
      }
    }).catch(err => {
      console.error("Upload error:", err)
      alert('网络错误，请稍后重试')
    })
  }

  const openBuyDialog = (item) => {
    if (!isLoggedIn && !localStorage.getItem('auth')) {
      setView('login')
      return
    }
    setBuyDialogItem(item)
    setBuyMessage(`你好，我在 OldNewHub 上看到了你发布的「${item.title}」。我想了解一下物品目前是否还在，以及是否方便约在校园内线下看货交易。`)
  }

  const closeBuyDialog = (force = false) => {
    if (isSendingBuyRequest && !force) return
    setBuyDialogItem(null)
    setBuyMessage('')
  }

  const sendBuyRequest = () => {
    if (!buyDialogItem) return
    if (!buyMessage.trim()) {
      alert('请填写邮件正文')
      return
    }

    setIsSendingBuyRequest(true)
    fetch(`/api/items/${buyDialogItem.itemId}/buy-request`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: buyMessage.trim() })
    }).then(async res => {
      if (res.ok) {
        alert('交易请求已发送到卖家邮箱')
        closeBuyDialog(true)
      } else {
        const error = await res.json().catch(() => ({ error: 'Send failed' }))
        alert('发送失败: ' + (error.error || '请稍后重试'))
      }
    }).catch(err => {
      console.error("Buy request error:", err)
      alert('网络错误，请稍后重试')
    }).finally(() => {
      setIsSendingBuyRequest(false)
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
                {isAdmin && <button className="btn-outline" onClick={() => setView('admin-audit')}>管理中心</button>}
                <button className="btn-outline" onClick={() => setView('list')}>广场</button>
                <button className="btn-outline" onClick={() => setView('my-market')}>我的市场</button>
                <button className="btn-primary" onClick={() => { setIsLoggedIn(false); setIsAdmin(false); localStorage.removeItem('auth'); localStorage.removeItem('role'); localStorage.removeItem('username'); setView('home'); }}>登出</button>
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
                <div key={item.itemId} className="item-card">
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
                  <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0.75rem 0' }}>交易地址：{item.tradeAddress || '未填写'}</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4f46e5', margin: '1rem 0' }}>¥{item.price}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn-outline" onClick={() => handleUpdatePrice(item.itemId, item.price)}>改价</button>
                    {item.status === 'REMOVED' ? (
                      <button className="btn-outline" onClick={() => handleUpdateStatus(item.itemId, 'APPROVED')}>上架</button>
                    ) : (
                      <button className="btn-outline" onClick={() => handleUpdateStatus(item.itemId, 'REMOVED')}>下架</button>
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
            <h2 style={{ marginBottom: '1rem' }}>精选好物</h2>

            {/* Category filter bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button
                className={categoryFilter === null ? 'btn-primary' : 'btn-outline'}
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                onClick={() => { setCategoryFilter(null); fetchItems(null); }}
              >全部</button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={categoryFilter === cat.id ? 'btn-primary' : 'btn-outline'}
                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => { setCategoryFilter(cat.id); fetchItems(cat.id); }}
                >{cat.name}</button>
              ))}
            </div>

            <div className="items-grid">
              {items.length > 0 ? items.map(item => (
                <div key={item.itemId} className="item-card">
                  {item.images && item.images.length > 0 && (
                    <img src={item.images[0].imageUrl} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} alt={item.title} />
                  )}
                  <h3>{item.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', height: '3em', overflow: 'hidden' }}>{item.description}</p>
                  <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0.75rem 0' }}>交易地址：{item.tradeAddress || '未填写'}</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4f46e5', margin: '1rem 0' }}>¥{item.price}</p>
                  <button className="btn-outline" style={{ width: '100%' }} onClick={() => alert('分享链接已复制')}>分享</button>
                  <button className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => openBuyDialog(item)}>Buy</button>
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
            <input type="email" placeholder="邮箱" required onChange={e => setEmail(e.target.value)} />
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
            <input name="tradeAddress" placeholder="线下交易地址（如：图书馆门口、宿舍楼下）" required />
            <select name="category" required style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' }} defaultValue="">
              <option value="" disabled>选择分类</option>
              <option value="1">图书</option>
              <option value="2">电子产品</option>
              <option value="3">生活用品</option>
              <option value="4">运动器材</option>
              <option value="5">其它</option>
            </select>
            <textarea name="description" placeholder="描述一下你的宝贝（品牌、成色、转手原因等）" rows="4"></textarea>
            
            <div className="upload-section" style={{ margin: '1rem 0' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>添加图片 (最多3张，每张小于 10MB)</label>
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

        {view === 'admin-audit' && (
          <div key="admin-audit" className="fade-in admin-audit-container">
            <h2 style={{ marginBottom: '2rem' }}>审核中心 (待处理: {pendingItems.length})</h2>
            
            {pendingItems.length > 0 ? (
              <div className="audit-book">
                <div className="audit-page">
                  <div className="audit-card">
                    <div className="audit-visual">
                      {pendingItems[currentPage].images && pendingItems[currentPage].images.length > 0 ? (
                        <div className="audit-image-preview">
                          <img src={pendingItems[currentPage].images[0].imageUrl} alt="Item" />
                          <div className="image-count">{pendingItems[currentPage].images.length}张图片</div>
                        </div>
                      ) : (
                        <div className="no-image-placeholder">暂无图片</div>
                      )}
                    </div>
                    
                    <div className="audit-details">
                      <div className="audit-info-header">
                        <span className="audit-id">#ID: {pendingItems[currentPage].itemId}</span>
                        <span className="audit-owner">发布者: {pendingItems[currentPage].owner?.username}</span>
                      </div>
                      <h3 className="audit-title">{pendingItems[currentPage].title}</h3>
                      <p className="audit-price">¥{pendingItems[currentPage].price}</p>
                      <p style={{ color: '#475569', fontWeight: '600', marginBottom: '1rem' }}>
                        交易地址：{pendingItems[currentPage].tradeAddress || '未填写'}
                      </p>
                      <div className="audit-description-box">
                        <p>{pendingItems[currentPage].description || '无描述'}</p>
                      </div>
                      
                      <div className="audit-actions">
                        <button className="btn-success" onClick={() => handleAudit(pendingItems[currentPage].itemId, 'APPROVED')}>通过审核</button>
                        <button className="btn-danger" onClick={() => handleAudit(pendingItems[currentPage].itemId, 'REMOVED')}>拒绝并下架</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="audit-navigation">
                  <button 
                    disabled={currentPage === 0} 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="nav-page-btn"
                  >上一页</button>
                  <span className="page-indicator">{currentPage + 1} / {pendingItems.length}</span>
                  <button 
                    disabled={currentPage === pendingItems.length - 1} 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="nav-page-btn"
                  >下一页</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '5rem', background: '#f8fafc', borderRadius: '16px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <p style={{ color: '#64748b' }}>所有闲置物品已处理完毕</p>
                <button className="btn-outline" style={{ marginTop: '1.5rem' }} onClick={() => setView('dashboard')}>返回个人中心</button>
              </div>
            )}
          </div>
        )}
      </div>

      {buyDialogItem && (
        <div className="modal-backdrop" onClick={() => closeBuyDialog()}>
          <div className="buy-dialog" onClick={e => e.stopPropagation()}>
            <h2>发送交易请求</h2>
            <label>邮件标题</label>
            <input
              value={`我对${buyDialogItem.title}很感兴趣，想约你校园线下交易`}
              readOnly
            />
            <label>邮件正文</label>
            <textarea
              rows="6"
              value={buyMessage}
              onChange={e => setBuyMessage(e.target.value)}
              placeholder="填写你想发送给卖家的具体内容"
              required
            />
            <div className="dialog-actions">
              <button className="btn-outline" type="button" onClick={() => closeBuyDialog()} disabled={isSendingBuyRequest}>取消</button>
              <button className="btn-primary" type="button" onClick={sendBuyRequest} disabled={isSendingBuyRequest}>
                {isSendingBuyRequest ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Footer */}
      <footer>
        <p>© 2026 OldNewHub. All rights reserved.</p>
        <p style={{ marginTop: '0.5rem' }}>创作者：Marsco</p>
      </footer>
    </div>
  )
}

export default App
