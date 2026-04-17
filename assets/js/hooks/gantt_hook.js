import Gantt from "frappe-gantt"

const GanttChart = {
  mounted() {
    this.gantt = null
    this.renderGantt()

    window.addEventListener("gantt:view-mode", (e) => {
      if (this.gantt) this.gantt.change_view_mode(e.detail.mode)
    })
  },

  updated() {
    this.renderGantt()
  },

  renderGantt() {
    const tasks = JSON.parse(this.el.dataset.tasks || "[]")
    if (tasks.length === 0) {
      this.el.innerHTML = '<div style="padding:2rem;color:var(--muted-foreground)">No tasks with due dates to display.</div>'
      return
    }

    this.el.innerHTML = ""

    this.gantt = new Gantt(this.el, tasks, {
      view_mode: "Week",
      date_format: "YYYY-MM-DD",
      on_date_change: (task, start, end) => {
        this.pushEvent("task_date_changed", {
          id: task.id,
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0]
        })
      }
    })
  }
}

export default GanttChart
