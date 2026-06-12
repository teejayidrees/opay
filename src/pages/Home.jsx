import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div style={styles.appContainer}>
      {/* 🟢 TOP NAV BAR */}
      <div style={styles.topHeader}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>ME</div>
          <div>
            <div style={styles.greeting}>Hello, Innovator 👋</div>
            <div style={styles.tierBadge}>KyC Tier 3</div>
          </div>
        </div>
        <div style={styles.headerIcons}>
          <span style={styles.iconItem}>🎧</span>
          <span style={styles.iconItem}>🔔</span>
        </div>
      </div>

      {/* 💳 OPAY WALLET CARD */}
      <div style={styles.balanceCard}>
        <div style={styles.cardHeader}>
          <span style={{ fontSize: 13, opacity: 0.9 }}>Available Balance</span>
          <button 
            onClick={() => setShowBalance(!showBalance)} 
            style={styles.eyeBtn}
          >
            {showBalance ? "👁️ Mute" : "👁️ Show"}
          </button>
        </div>
        <div style={styles.balanceAmount}>
          ₦{showBalance ? "152,450.00" : "******"}
        </div>
        <div style={styles.cardFooter}>
          <div style={styles.footerAction}>➕ Add Money</div>
          <div style={styles.footerAction}>📊 Transaction History</div>
        </div>
      </div>

      {/* 🚀 SOUNDPASS MAIN FEATURE HERO SECTION */}
      <div style={styles.soundPassHero}>
        <div style={styles.heroTextContent}>
          <h3 style={styles.heroTitle}>OPay SoundPass™</h3>
          <p style={styles.heroDescription}>
            Pay merchants instantly through secure, high-frequency sound waves. No internet network required.
          </p>
        </div>
        <div style={styles.actionGridContainer}>
          <button onClick={() => navigate("/sender")} style={styles.featureLaunchBtn}>
            <div style={styles.btnIconCircle}>🏪</div>
            <span style={styles.btnLabelText}>Merchant (POS Mode)</span>
          </button>
          
          <button onClick={() => navigate("/receiver")} style={styles.featureLaunchBtnSecondary}>
            <div style={styles.btnIconCircleBlue}>📱</div>
            <span style={styles.btnLabelText}>Customer (Scan Mode)</span>
          </button>
        </div>
      </div>

      {/* 📱 STANDARD OPAY UTILITY GRID SERVICES */}
      <div style={styles.sectionWrapper}>
        <h4 style={styles.sectionHeading}>Financial Services</h4>
        <div style={styles.servicesGrid}>
          <div style={styles.serviceItem}><div style={styles.serviceIconBg}>💸</div><span>To Bank</span></div>
          <div style={styles.serviceItem}><div style={styles.serviceIconBg}>🟩</div><span>To OPay</span></div>
          <div style={styles.serviceItem}><div style={styles.serviceIconBg}>📱</div><span>Airtime</span></div>
          <div style={styles.serviceItem}><div style={styles.serviceIconBg}>💡</div><span>Electricity</span></div>
          <div style={styles.serviceItem}><div style={styles.serviceIconBg}>📺</div><span>TV Cable</span></div>
          <div style={styles.serviceItem}><div style={styles.serviceIconBg}>🛡️</div><span>Savings</span></div>
          <div style={styles.serviceItem}><div style={styles.serviceIconBg}>📈</div><span>Loans</span></div>
          <div style={styles.serviceItem}><div style={styles.serviceIconBg}>🛍️</div><span>More</span></div>
        </div>
      </div>

      {/* 🗺️ BOTTOM NATIVE NAVIGATION TABS */}
      <div style={styles.bottomTabBar}>
        <div style={{ ...styles.tabItem, color: "#00c853" }}><span style={{fontSize: 20}}>🏠</span><span>Home</span></div>
        <div style={styles.tabItem}><span style={{fontSize: 20}}>📊</span><span>Rewards</span></div>
        <div style={styles.tabItem}><span style={{fontSize: 20}}>💳</span><span>Cards</span></div>
        <div style={styles.tabItem}><span style={{fontSize: 20}}>👤</span><span>Me</span></div>
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    width: "100vw",
    maxWidth: "480px", // Locks layout gracefully into a native smartphone profile view
    minHeight: "100vh",
    margin: "0 auto",
    backgroundColor: "#f4f6f8",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    paddingBottom: "90px",
    position: "relative",
    boxSizing: "border-box",
  },
  topHeader: {
    backgroundColor: "#00c853", // Official Vibrant OPay Brand Green
    padding: "20px 16px 40px 16px",
    display: "flex",
    justifyContent: "between",
    alignItems: "center",
    color: "white",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.2)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    fontSize: "14px",
  },
  greeting: {
    fontSize: "16px",
    fontWeight: "600",
  },
  tierBadge: {
    fontSize: "11px",
    backgroundColor: "rgba(0,0,0,0.15)",
    padding: "2px 8px",
    borderRadius: "20px",
    display: "inline-block",
    marginTop: "2px",
  },
  headerIcons: {
    display: "flex",
    gap: "16px",
    fontSize: "20px",
  },
  iconItem: {
    cursor: "pointer",
  },
  balanceCard: {
    backgroundColor: "#0b1f3a", // Deep OPay Secondary Corporate Navy Blue
    borderRadius: "16px",
    padding: "20px",
    margin: "-25px 16px 20px 16px",
    color: "white",
    boxShadow: "0 8px 16px rgba(11, 31, 58, 0.15)",
    position: "relative",
    zIndex: 2,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "between",
    alignItems: "center",
  },
  eyeBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.7)",
    fontSize: "12px",
    cursor: "pointer",
  },
  balanceAmount: {
    fontSize: "28px",
    fontWeight: "700",
    margin: "12px 0 20px 0",
    letterSpacing: "0.5px",
  },
  cardFooter: {
    display: "flex",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    paddingTop: "14px",
    justifyContent: "between",
  },
  footerAction: {
    fontSize: "13px",
    fontWeight: "500",
    opacity: 0.9,
    cursor: "pointer",
  },
  soundPassHero: {
    backgroundColor: "white",
    borderRadius: "16px",
    margin: "0 16px 20px 16px",
    padding: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    border: "1px solid rgba(0,200,83,0.15)",
  },
  heroTextContent: {
    marginBottom: "16px",
  },
  heroTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#0b1f3a",
    fontWeight: "700",
  },
  heroDescription: {
    margin: "6px 0 0 0",
    fontSize: "12px",
    color: "#666",
    lineHeight: "1.5",
  },
  actionGridContainer: {
    display: "flex",
    gap: "12px",
  },
  featureLaunchBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#e8f5e9",
    border: "1px solid #00c853",
    padding: "12px",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "left",
  },
  featureLaunchBtnSecondary: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#e3f2fd",
    border: "1px solid #1e88e5",
    padding: "12px",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "left",
  },
  btnIconCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#00c853",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "18px",
  },
  btnIconCircleBlue: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#1e88e5",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "18px",
  },
  btnLabelText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#333",
  },
  sectionWrapper: {
    backgroundColor: "white",
    padding: "16px",
    margin: "0 16px",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
  },
  sectionHeading: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    color: "#0b1f3a",
    fontWeight: "700",
  },
  servicesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    rowGap: "20px",
    columnGap: "10px",
  },
  serviceItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "11px",
    color: "#555",
    fontWeight: "500",
  },
  serviceIconBg: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    backgroundColor: "#f5f6f9",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "20px",
    marginBottom: "6px",
  },
  bottomTabBar: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: "480px",
    height: "65px",
    backgroundColor: "white",
    borderTop: "1px solid #eef2f5",
    display: "flex",
    justifyContent: "around",
    alignItems: "center",
    zIndex: 10,
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  tabItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: "10px",
    color: "#888",
    fontWeight: "600",
    cursor: "pointer",
    flex: 1,
    gap: "2px",
  },
};