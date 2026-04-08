from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    git_repos = relationship("GitRepo", back_populates="application", cascade="all, delete-orphan", lazy="selectin")
    resources = relationship("Resource", back_populates="application", cascade="all, delete-orphan", lazy="selectin")
    role_assignments = relationship("RoleAssignment", back_populates="application", cascade="all, delete-orphan", lazy="selectin")
    people = relationship("Person", back_populates="application", cascade="all, delete-orphan", lazy="selectin")
    tasks = relationship("Task", back_populates="application", cascade="all, delete-orphan", lazy="selectin")


class GitRepo(Base):
    __tablename__ = "git_repos"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    repo_name = Column(String(300), nullable=False)
    owner = Column(String(200), default="")
    link = Column(String(500), default="")

    application = relationship("Application", back_populates="git_repos")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    resource_group = Column(String(200), nullable=False)
    resource_name = Column(String(300), nullable=False)
    type = Column(String(200), default="")
    tier_sku = Column(String(200), default="")

    application = relationship("Application", back_populates="resources")


class RoleAssignment(Base):
    __tablename__ = "role_assignments"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    resource_group = Column(String(200), nullable=False)
    role_name = Column(String(200), nullable=False)
    resource_name = Column(String(300), default="")

    application = relationship("Application", back_populates="role_assignments")


class Person(Base):
    __tablename__ = "people"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    applications_involved = Column(Text, default="")
    resource_groups_involved = Column(Text, default="")
    permissions = Column(Text, default="")

    application = relationship("Application", back_populates="people")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, default="")
    status = Column(String(50), nullable=False, default="not-started")  # not-started, in-progress, completed
    severity = Column(String(50), nullable=False, default="medium")  # low, medium, high, critical
    assigned_to = Column(String(200), default="")
    assigned_on = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application", back_populates="tasks")
