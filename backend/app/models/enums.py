import enum


class UserRole(str, enum.Enum):
    candidate = "candidate"
    employer = "employer"


class Availability(str, enum.Enum):
    fulltime = "fulltime"
    freelance = "freelance"
    parttime = "parttime"
    not_available = "not_available"


class PortfolioVisibility(str, enum.Enum):
    draft = "draft"
    live = "live"


class ProjectType(str, enum.Enum):
    professional = "professional"
    personal = "personal"
    case_study = "case_study"
    freelance = "freelance"
    open_source = "open_source"


class JobStatus(str, enum.Enum):
    open = "open"
    closed = "closed"


class ExperienceLevel(str, enum.Enum):
    entry = "entry"
    junior = "junior"
    mid = "mid"
    senior = "senior"
    lead = "lead"


class EmploymentType(str, enum.Enum):
    fulltime = "fulltime"
    parttime = "parttime"
    contract = "contract"
    freelance = "freelance"


class ApplicationStatus(str, enum.Enum):
    applied = "applied"
    reviewing = "reviewing"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"
    withdrawn = "withdrawn"


class ShortlistStatus(str, enum.Enum):
    saved = "saved"
    passed = "passed"
    interview_requested = "interview_requested"
