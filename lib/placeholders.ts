// Types for our placeholder data
export type Meeting = {
  id: string
  title: string
  startTime: Date
  endTime: Date
  attendees: string[]
  location?: string
  description?: string
  isConfirmed: boolean
}

export type Task = {
  id: string
  title: string
  description?: string
  dueDate?: Date
  priority: "low" | "medium" | "high"
  status: "todo" | "in-progress" | "completed"
  createdAt: Date
  updatedAt: Date
}

export type Email = {
  id: string
  subject: string
  sender: string
  recipients: string[]
  content: string
  attachments: string[]
  read: boolean
  starred: boolean
  timestamp: Date
}

export type Notification = {
  id: string
  title: string
  description: string
  type: "info" | "warning" | "success" | "error"
  read: boolean
  timestamp: Date
  actionUrl?: string
}

export type ProductivityMetric = {
  date: Date
  emailsProcessed: number
  meetingsAttended: number
  tasksCompleted: number
  timeSaved: number // in minutes
}

// Placeholder functions that will eventually connect to Firebase

// Meeting/Calendar functions
export const getUpcomingMeetings = async (userId: string, days = 7): Promise<Meeting[]> => {
  console.log(`[PLACEHOLDER] Getting upcoming meetings for user ${userId} for the next ${days} days`)

  // Return mock data for now
  return [
    {
      id: "1",
      title: "Team Standup",
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      attendees: ["user1@example.com", "user2@example.com"],
      location: "Zoom",
      isConfirmed: true,
    },
    {
      id: "2",
      title: "Client Presentation",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
      attendees: ["client@example.com", "manager@example.com"],
      location: "Conference Room A",
      description: "Final presentation for the Q1 project",
      isConfirmed: true,
    },
    {
      id: "3",
      title: "Product Review",
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
      endTime: new Date(Date.now() + 49 * 60 * 60 * 1000),
      attendees: ["product@example.com", "design@example.com"],
      isConfirmed: false,
    },
  ]
}

export const scheduleMeeting = async (userId: string, meetingData: Omit<Meeting, "id">): Promise<Meeting> => {
  console.log(`[PLACEHOLDER] Scheduling meeting for user ${userId}`, meetingData)

  // In a real implementation, this would create a meeting in Firebase and return the created meeting
  return {
    id: Math.random().toString(36).substring(2, 9),
    ...meetingData,
  }
}

// Task management functions
export const getUserTasks = async (userId: string, status?: Task["status"]): Promise<Task[]> => {
  console.log(`[PLACEHOLDER] Getting tasks for user ${userId} with status ${status || "all"}`)

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Return mock data
  const allTasks: Task[] = [
    {
      id: "1",
      title: "Prepare presentation",
      description: "Create slides for the client meeting",
      dueDate: tomorrow,
      priority: "high",
      status: "in-progress",
      createdAt: yesterday,
      updatedAt: now,
    },
    {
      id: "2",
      title: "Review code PR",
      priority: "medium",
      status: "todo",
      createdAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: "3",
      title: "Update documentation",
      description: "Add new API endpoints to the docs",
      priority: "low",
      status: "completed",
      createdAt: yesterday,
      updatedAt: now,
    },
    {
      id: "4",
      title: "Weekly report",
      description: "Compile weekly metrics",
      dueDate: tomorrow,
      priority: "medium",
      status: "todo",
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Filter by status if provided
  return status ? allTasks.filter((task) => task.status === status) : allTasks
}

export const createTask = async (
  userId: string,
  taskData: Omit<Task, "id" | "createdAt" | "updatedAt">,
): Promise<Task> => {
  console.log(`[PLACEHOLDER] Creating task for user ${userId}`, taskData)

  const now = new Date()

  // In a real implementation, this would create a task in Firebase and return the created task
  return {
    id: Math.random().toString(36).substring(2, 9),
    ...taskData,
    createdAt: now,
    updatedAt: now,
  }
}

export const updateTaskStatus = async (userId: string, taskId: string, status: Task["status"]): Promise<Task> => {
  console.log(`[PLACEHOLDER] Updating task ${taskId} status to ${status} for user ${userId}`)

  // In a real implementation, this would update the task in Firebase and return the updated task
  return {
    id: taskId,
    title: "Sample task",
    priority: "medium",
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// Email functions
export const getRecentEmails = async (userId: string, limit = 10): Promise<Email[]> => {
  console.log(`[PLACEHOLDER] Getting ${limit} recent emails for user ${userId}`)

  // Return mock data
  return [
    {
      id: "1",
      subject: "Project Update",
      sender: "manager@example.com",
      recipients: ["you@example.com"],
      content: "Here is the latest update on the project...",
      attachments: [],
      read: true,
      starred: false,
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
    {
      id: "2",
      subject: "Meeting Invitation",
      sender: "calendar@example.com",
      recipients: ["you@example.com", "team@example.com"],
      content: "You have been invited to a meeting...",
      attachments: ["calendar.ics"],
      read: false,
      starred: true,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: "3",
      subject: "Invoice #12345",
      sender: "billing@example.com",
      recipients: ["you@example.com"],
      content: "Your invoice is attached...",
      attachments: ["invoice.pdf"],
      read: false,
      starred: false,
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  ]
}

export const draftEmail = async (userId: string, emailData: Partial<Email>): Promise<Email> => {
  console.log(`[PLACEHOLDER] Drafting email for user ${userId}`, emailData)

  // In a real implementation, this would create an email draft in Firebase and return it
  return {
    id: Math.random().toString(36).substring(2, 9),
    subject: emailData.subject || "No subject",
    sender: "you@example.com",
    recipients: emailData.recipients || [],
    content: emailData.content || "",
    attachments: emailData.attachments || [],
    read: true,
    starred: false,
    timestamp: new Date(),
  }
}

// Notification functions
export const getUserNotifications = async (userId: string, unreadOnly = false): Promise<Notification[]> => {
  console.log(`[PLACEHOLDER] Getting ${unreadOnly ? "unread" : "all"} notifications for user ${userId}`)

  // Return mock data
  const allNotifications: Notification[] = [
    {
      id: "1",
      title: "New message",
      description: "You have a new message from John",
      type: "info",
      read: false,
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      actionUrl: "/messages",
    },
    {
      id: "2",
      title: "Meeting reminder",
      description: "Team standup in 15 minutes",
      type: "warning",
      read: false,
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      actionUrl: "/calendar",
    },
    {
      id: "3",
      title: "Task completed",
      description: 'Your task "Update documentation" has been marked as completed',
      type: "success",
      read: true,
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      actionUrl: "/tasks",
    },
  ]

  // Filter by read status if needed
  return unreadOnly ? allNotifications.filter((notification) => !notification.read) : allNotifications
}

export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<void> => {
  console.log(`[PLACEHOLDER] Marking notification ${notificationId} as read for user ${userId}`)

  // In a real implementation, this would update the notification in Firebase
}

// Productivity metrics
export const getProductivityMetrics = async (userId: string, days = 7): Promise<ProductivityMetric[]> => {
  console.log(`[PLACEHOLDER] Getting productivity metrics for user ${userId} for the last ${days} days`)

  const metrics: ProductivityMetric[] = []
  const now = new Date()

  // Generate mock data for each day
  for (let i = 0; i < days; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    metrics.push({
      date,
      emailsProcessed: Math.floor(Math.random() * 20) + 5,
      meetingsAttended: Math.floor(Math.random() * 5) + 1,
      tasksCompleted: Math.floor(Math.random() * 8) + 2,
      timeSaved: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
    })
  }

  return metrics
}

// Summary statistics
export const getUserDashboardStats = async (
  userId: string,
): Promise<{
  tasksCompleted: number
  totalTasks: number
  timeSaved: number // in hours
  upcomingMeetings: number
  unreadEmails: number
  productivityIncrease: number // percentage
}> => {
  console.log(`[PLACEHOLDER] Getting dashboard stats for user ${userId}`)

  // Return mock data
  return {
    tasksCompleted: 24,
    totalTasks: 36,
    timeSaved: 12.5, // hours
    upcomingMeetings: 3,
    unreadEmails: 7,
    productivityIncrease: 15, // percentage
  }
}

