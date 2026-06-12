export default function Button({ children, onClick, variant = "primary" }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: variant === "primary" ? "#00c853" : "#e0e0e0",
        color: variant === "primary" ? "white" : "#000",
        padding: "12px 18px",
        borderRadius: "10px",
        border: "none",
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}