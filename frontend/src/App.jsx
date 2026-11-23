import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import About from './pages/About'
import HowItWorks from './pages/HowItWorks'
import Feedback from './pages/Feedback'

export default function App() {
  return (
    <BrowserRouter>
      <header className="site-header">
        <nav className="navbar" aria-label="Main navigation">
          <NavLink to="/" className="brand"><span className="brand-icon">✳</span> ASL Recognition</NavLink>
          <div className="nav-links">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/how-it-works">How It Works</NavLink>
            <NavLink to="/feedback">Feedback</NavLink>
          </div>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="*" element={<main className="page-content"><h1>Page not found</h1><NavLink to="/">Return home</NavLink></main>} />
      </Routes>
      <footer className="site-footer">
        <div className="footer-content">
          <strong>ASL Recognition</strong>
          <span>A Computer Vision & Machine Learning Project</span>
          <a href="https://github.com/aimesanchez/American-Sign-Language-Translator" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </div>
      </footer>
    </BrowserRouter>
  )
}
