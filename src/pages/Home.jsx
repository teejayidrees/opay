import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>OPay SoundPass</h1>

      <p style={styles.subtitle}>
        Select Mode
      </p>

      <div style={styles.buttons}>
        <button onClick={() => navigate("/sender")} style={styles.btn}>
          Sender (POS)
        </button>

        <button onClick={() => navigate("/receiver")} style={styles.btn2}>
          Receiver
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#f6f9fc",
  },
  title: {
    fontSize: 32,
    color: "#0b1f3a",
    marginBottom: 10,
  },
  subtitle: {
    marginBottom: 20,
    color: "#555",
  },
  buttons: {
    display: "flex",
    gap: 15,
  },
  btn: {
    padding: "12px 20px",
    background: "#00c853",
    border: "none",
    color: "white",
    borderRadius: 10,
    cursor: "pointer",
  },
  btn2: {
    padding: "12px 20px",
    background: "#0b1f3a",
    border: "none",
    color: "white",
    borderRadius: 10,
    cursor: "pointer",
  },
};