from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_users: int
    total_clubs: int
    total_events: int
    total_applications: int
    pending_applications: int
    total_attendance_records: int


class ClubStats(BaseModel):
    club_name: str
    member_count: int
    event_count: int
    application_count: int
    total_attendance: int


class StudentStats(BaseModel):
    clubs_joined: int
    events_attended: int
    applications_submitted: int
