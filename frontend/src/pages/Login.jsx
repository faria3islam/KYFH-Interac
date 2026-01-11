import { useNavigate } from "react-router-dom"

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded"
        onClick={() => navigate("/home")}
      >
        Enter App
      </button>
    </div>
  )
}