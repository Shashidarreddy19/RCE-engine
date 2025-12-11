# task_manager.py
import json
import os

TASK_FILE = "tasks.json"

class Task:
    def __init__(self, tid, title, status="Pending"):
        self.tid = tid
        self.title = title
        self.status = status

    def to_dict(self):
        return {
            "id": self.tid,
            "title": self.title,
            "status": self.status
        }

class TaskManager:
    def __init__(self):
        self.tasks = []
        self.load()

    def load(self):
        if os.path.exists(TASK_FILE):
            with open(TASK_FILE, "r") as f:
                data = json.load(f)
                for t in data:
                    self.tasks.append(Task(t["id"], t["title"], t["status"]))

    def save(self):
        with open(TASK_FILE, "w") as f:
            json.dump([t.to_dict() for t in self.tasks], f, indent=4)

    def add_task(self, title):
        tid = len(self.tasks) + 1
        newtask = Task(tid, title)
        self.tasks.append(newtask)
        self.save()
        print(f"Task added: {title}")

    def delete_task(self, tid):
        self.tasks = [t for t in self.tasks if t.tid != tid]
        self.save()
        print(f"Task {tid} deleted")

    def mark_done(self, tid):
        for t in self.tasks:
            if t.tid == tid:
                t.status = "Done"
                break
        self.save()

    def display(self):
        if not self.tasks:
            print("No tasks")
            return
        print("\n---- TASK LIST ----")
        for t in self.tasks:
            print(f"ID: {t.tid} | {t.title} | {t.status}")

def menu():
    print("\n1. Add Task")
    print("2. Delete Task")
    print("3. Mark Done")
    print("4. View Tasks")
    print("5. Exit")

def main():
    tm = TaskManager()
    while True:
        menu()
        choice = input("Enter choice: ")

        if choice == "1":
            title = input("Enter task title: ")
            tm.add_task(title)

        elif choice == "2":
            tid = int(input("Enter task ID: "))
            tm.delete_task(tid)

        elif choice == "3":
            tid = int(input("Enter task ID: "))
            tm.mark_done(tid)

        elif choice == "4":
            tm.display()

        elif choice == "5":
            print("Exiting...")
            break

        else:
            print("Invalid choice")

if __name__ == "__main__":
    main()
