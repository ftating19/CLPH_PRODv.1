import { cn } from "@/lib/utils"
import { Star, Users, MessageCircle, Eye, Heart, UserPlus } from "lucide-react"

interface TutorItem {
  id: string
  name: string
  subject: string
  rating: number
  studentsHelped: number
  status: "available" | "busy" | "offline"
  expertise: string[]
}

interface List01Props {
  totalTutors?: string
  tutors?: TutorItem[]
  className?: string
}

const TUTORS: TutorItem[] = [
  {
    id: "1",
    name: "Sarah Chen",
    subject: "Data Structures",
    rating: 4.9,
    studentsHelped: 45,
    status: "available",
    expertise: ["Algorithms", "Java", "Python"],
  },
  {
    id: "2",
    name: "Mark Rodriguez",
    subject: "Web Development",
    rating: 4.8,
    studentsHelped: 32,
    status: "available",
    expertise: ["React", "Node.js", "CSS"],
  },
  {
    id: "3",
    name: "Emily Johnson",
    subject: "Database Systems",
    rating: 4.7,
    studentsHelped: 28,
    status: "busy",
    expertise: ["SQL", "MongoDB", "Design"],
  },
  {
    id: "4",
    name: "Alex Kim",
    subject: "Mobile Development",
    rating: 4.9,
    studentsHelped: 38,
    status: "available",
    expertise: ["Flutter", "React Native"],
  },
  {
    id: "5",
    name: "Lisa Wang",
    subject: "Machine Learning",
    rating: 4.6,
    studentsHelped: 22,
    status: "offline",
    expertise: ["Python", "TensorFlow", "AI"],
  },
]

export default function List01({ totalTutors = "24 Active", tutors = TUTORS, className }: List01Props) {
  return (
    <div
      className={cn(
        "w-full max-w-xl mx-auto",
        "bg-white dark:bg-zinc-900/70",
        "border border-zinc-100 dark:border-zinc-800",
        "rounded-xl shadow-sm backdrop-blur-xl",
        className,
      )}
    >
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">Available Tutors</p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{totalTutors}</h1>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Recommended for You</h2>
        </div>

        <div className="space-y-1">
          {tutors.map((tutor) => (
            <div
              key={tutor.id}
              className={cn(
                "group flex items-center justify-between",
                "p-2 rounded-lg",
                "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                "transition-all duration-200",
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn("p-1.5 rounded-lg", {
                    "bg-green-100 dark:bg-green-900/30": tutor.status === "available",
                    "bg-yellow-100 dark:bg-yellow-900/30": tutor.status === "busy",
                    "bg-gray-100 dark:bg-gray-900/30": tutor.status === "offline",
                  })}
                >
                  <Users
                    className={cn("w-3.5 h-3.5", {
                      "text-green-600 dark:text-green-400": tutor.status === "available",
                      "text-yellow-600 dark:text-yellow-400": tutor.status === "busy",
                      "text-gray-600 dark:text-gray-400": tutor.status === "offline",
                    })}
                  />
                </div>
                <div>
                  <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{tutor.name}</h3>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{tutor.subject}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{tutor.rating}</span>
                </div>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{tutor.studentsHelped} helped</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2",
              "py-2 px-3 rounded-lg",
              "text-xs font-medium",
              "bg-zinc-900 dark:bg-zinc-50",
              "text-zinc-50 dark:text-zinc-900",
              "hover:bg-zinc-800 dark:hover:bg-zinc-200",
              "shadow-sm hover:shadow",
              "transition-all duration-200",
            )}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Connect</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2",
              "py-2 px-3 rounded-lg",
              "text-xs font-medium",
              "bg-zinc-900 dark:bg-zinc-50",
              "text-zinc-50 dark:text-zinc-900",
              "hover:bg-zinc-800 dark:hover:bg-zinc-200",
              "shadow-sm hover:shadow",
              "transition-all duration-200",
            )}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Message</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2",
              "py-2 px-3 rounded-lg",
              "text-xs font-medium",
              "bg-zinc-900 dark:bg-zinc-50",
              "text-zinc-50 dark:text-zinc-900",
              "hover:bg-zinc-800 dark:hover:bg-zinc-200",
              "shadow-sm hover:shadow",
              "transition-all duration-200",
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2",
              "py-2 px-3 rounded-lg",
              "text-xs font-medium",
              "bg-zinc-900 dark:bg-zinc-50",
              "text-zinc-50 dark:text-zinc-900",
              "hover:bg-zinc-800 dark:hover:bg-zinc-200",
              "shadow-sm hover:shadow",
              "transition-all duration-200",
            )}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  )
}
