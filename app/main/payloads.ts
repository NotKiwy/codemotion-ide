export type SaveContentPayload = {
    filename: string
    content: string
}
export type NotificationDataPayload = {
    icon: string,
    image?: string
    initials?: string,
    title: string,
    type?: string,
    description: string
}