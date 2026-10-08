import { getTodos } from "@/app/todos/action"
import { TodosView } from "@/components/todos-view"

export default async function TodosPage() {
  const { todos, error, tableMissing } = await getTodos()

  return (
    <TodosView
      initialTodos={todos}
      tableMissing={tableMissing}
      dbError={error}
    />
  )
}
