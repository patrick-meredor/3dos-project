import { CheckCircle2, Circle, ArrowRightCircle } from "lucide-react"

export default function Roadmap() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Development Roadmap</h1>
        <p className="text-muted-foreground text-lg">
          My guide and feature backlog for the habit tracker project.
        </p>
      </div>

      {/* IN PROGRESS SECTION */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <ArrowRightCircle className="w-6 h-6 text-blue-500" />
          Current Focus (In Progress)
        </h2>
        <ul className="space-y-4 border-l-2 border-border ml-3 pl-6">
          <li>
            <strong className="block text-lg font-medium">Database Integration</strong>
            <span className="text-muted-foreground">Set up the chosen backend and create the initial tables for tracking daily habits.</span>
          </li>
          <li>
            <strong className="block text-lg font-medium">Rotating Header</strong>
            <span className="text-muted-foreground">Implement the 5-second interval quote rotation on the main dashboard.</span>
          </li>
        </ul>
      </section>

      {/* BACKLOG SECTION */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Circle className="w-6 h-6 text-muted-foreground" />
          Upcoming Features (Backlog)
        </h2>
        <ul className="space-y-4 border-l-2 border-border ml-3 pl-6">
          <li>
            <strong className="block text-lg font-medium">Authentication</strong>
            <span className="text-muted-foreground">Add secure login so my personal habit data remains private.</span>
          </li>
          <li>
            <strong className="block text-lg font-medium">Streak Calculation</strong>
            <span className="text-muted-foreground">Write the logic to track and display consecutive days a habit is completed.</span>
          </li>
        </ul>
      </section>

      {/* COMPLETED SECTION */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          Completed
        </h2>
        <ul className="space-y-4 border-l-2 border-border ml-3 pl-6">
          <li>
            <strong className="block text-lg font-medium text-muted-foreground line-through">Initial Setup</strong>
            <span className="text-muted-foreground">Configured Next.js, added local fonts, and installed shadcn/ui components.</span>
          </li>
        </ul>
      </section>
    </div>
  )
}