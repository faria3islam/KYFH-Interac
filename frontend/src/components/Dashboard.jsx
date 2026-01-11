import { useEffect, useState } from "react"

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch("http://localhost:8000/dashboard")
      .then((res) => res.json())
      .then(setData)
  }, [])

  if (!data) return <p>Loading...</p>

  return (
    <div className="border p-4">
      <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
      <p>Total Budget: ${data.total_budget}</p>
      <p>Remaining: ${data.remaining}</p>
      <pre className="mt-4 bg-gray-100 p-2">{JSON.stringify(data.categories, null, 2)}</pre>
    </div>
  )
}