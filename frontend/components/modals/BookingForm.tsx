import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface BookingFormProps {
  tutor: any
  currentUser: any
  onClose: () => void
}

export default function BookingForm({ tutor, currentUser, onClose }: BookingFormProps) {
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [timeFrom, setTimeFrom] = React.useState("")
  const [timeTo, setTimeTo] = React.useState("")
  const [name, setName] = React.useState(tutor ? tutor.name : "")
  const [status, setStatus] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleBooking = async () => {
    if (!tutor || !currentUser || !startDate || !endDate || !timeFrom || !timeTo || !name) {
      setStatus("Please fill all required fields.")
      return
    }
    setLoading(true)
    setStatus("")
    try {
      const preferred_dates = [startDate, endDate]
      const preferred_time = `${timeFrom} - ${timeTo}`
      const res = await fetch("http://localhost:4000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_id: tutor.user_id,
          name,
          student_id: currentUser.user_id,
          preferred_dates,
          preferred_time
        })
      })
      const data = await res.json()
      if (data.success) {
        setStatus("Booking successful!")
        setTimeout(() => { onClose() }, 1200)
      } else {
        setStatus("Booking failed. Please try again.")
      }
    } catch {
      setStatus("Booking failed. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tutor's Name</Label>
        <Input id="name" type="text" value={name} readOnly />
      </div>
      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="endDate">End Date</Label>
        <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Preferred Time Range</Label>
        <div className="flex gap-2">
          <Input id="sessionTimeFrom" type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} placeholder="From" />
          <span className="self-center">to</span>
          <Input id="sessionTimeTo" type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} placeholder="To" />
        </div>
      </div>
      <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleBooking} disabled={loading}>
        {loading ? "Booking..." : "Send Booking Request"}
      </Button>
      {status && <div className="text-center text-sm mt-2 text-blue-600">{status}</div>}
    </div>
  )
}
