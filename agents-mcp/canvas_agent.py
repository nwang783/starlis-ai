"""
Canvas LMS Integration Agent for the Personal Assistant

This module provides a Canvas learning management system integration
that allows students to access their courses, assignments, submissions,
and grades through the personal assistant.
"""

import os
import asyncio
from typing import List, Dict, Any, Union
from datetime import datetime, timedelta
import json
import pytz
import html2text

# Agent SDK imports
from agents import Agent, function_tool, RunContextWrapper
from agents.model_settings import ModelSettings

# Canvas API imports
from canvasapi import Canvas
from canvasapi.exceptions import CanvasException, ResourceDoesNotExist

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Environment variables for Canvas
CANVAS_API_URL = os.environ.get("CANVAS_API_URL")
CANVAS_API_KEY = os.environ.get("CANVAS_API_KEY")
USER_TIMEZONE = os.environ.get("USER_TIMEZONE", "America/New_York")

###########################################
# Canvas API Client Setup
###########################################

def get_canvas_client():
    """Get an authenticated Canvas API client"""
    if not CANVAS_API_URL or not CANVAS_API_KEY:
        raise ValueError("Canvas API credentials not found in environment variables (CANVAS_API_URL, CANVAS_API_KEY)")
    
    return Canvas(CANVAS_API_URL, CANVAS_API_KEY)


def html_to_text(html_content):
    """Convert HTML to plain text"""
    if not html_content:
        return ""
    
    h = html2text.HTML2Text()
    h.ignore_links = False
    h.ignore_images = True
    h.ignore_tables = False
    return h.handle(html_content)


def format_datetime(dt_str):
    """Format Canvas datetime strings to user-friendly format in user's timezone"""
    if not dt_str:
        return "No date specified"
    
    try:
        # Parse the datetime string from Canvas (usually in ISO format)
        dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        
        # Convert to user's timezone
        user_tz = pytz.timezone(USER_TIMEZONE)
        if not dt.tzinfo:
            # If no timezone info, assume UTC
            dt = dt.replace(tzinfo=pytz.UTC)
        
        # Convert to user timezone
        local_dt = dt.astimezone(user_tz)
        
        # Format datetime
        return local_dt.strftime('%Y-%m-%d %I:%M %p %Z')
    except (ValueError, TypeError):
        return dt_str

###########################################
# Course Management Tools
###########################################

@function_tool
def list_courses(include_past_courses: bool) -> str:
    """List all courses the student is enrolled in
    
    Args:
        include_past_courses: Whether to include past/completed courses (true/false)
    
    Returns:
        A formatted string with the list of courses
    """
    try:
        # Get the Canvas client
        canvas = get_canvas_client()
        
        # Get the current user
        user = canvas.get_current_user()
        
        # Get enrollments based on the parameter
        enrollment_state = ['active']
        if include_past_courses:
            enrollment_state.append('completed')
        
        # Get courses
        courses = user.get_courses(enrollment_state=enrollment_state)
        
        # Format the results
        if not courses:
            return "No courses found."
        
        result = "Your Canvas Courses:\n"
        
        for i, course in enumerate(courses, 1):
            # Get course details
            course_code = getattr(course, 'course_code', 'N/A')
            course_name = getattr(course, 'name', 'Unnamed Course')
            course_id = getattr(course, 'id', 'Unknown ID')
            
            # Get enrollment details
            enrollment_type = "Enrolled"
            try:
                enrollments = course.get_enrollments(user_id=user.id)
                for enrollment in enrollments:
                    if hasattr(enrollment, 'type'):
                        enrollment_type = enrollment.type.replace('_', ' ').title()
                    break
            except:
                pass
            
            # Format course info
            result += f"{i}. {course_code}: {course_name}\n"
            result += f"   ID: {course_id}\n"
            result += f"   Role: {enrollment_type}\n"
            
            # Try to get term info if available
            if hasattr(course, 'term'):
                term_name = getattr(course.term, 'name', 'Unknown Term')
                result += f"   Term: {term_name}\n"
            
            result += "\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while listing courses: {str(e)}"


@function_tool
def get_course_details(course_id: str) -> str:
    """Get detailed information about a specific course
    
    Args:
        course_id: The Canvas course ID
    
    Returns:
        A formatted string with course details
    """
    try:
        # Get the Canvas client
        canvas = get_canvas_client()
        
        # Get course details
        course = canvas.get_course(course_id, include=['term', 'teachers', 'syllabus_body'])
        
        # Basic course info
        course_code = getattr(course, 'course_code', 'N/A')
        course_name = getattr(course, 'name', 'Unnamed Course')
        
        # Format the result
        result = f"Course: {course_code} - {course_name}\n"
        result += f"ID: {course_id}\n"
        
        # Add term info if available
        if hasattr(course, 'term'):
            term_name = getattr(course.term, 'name', 'Unknown Term')
            result += f"Term: {term_name}\n"
        
        # Add course dates if available
        if hasattr(course, 'start_at') and course.start_at:
            start_date = format_datetime(course.start_at)
            result += f"Start Date: {start_date}\n"
        
        if hasattr(course, 'end_at') and course.end_at:
            end_date = format_datetime(course.end_at)
            result += f"End Date: {end_date}\n"
        
        # Add teachers/instructors
        if hasattr(course, 'teachers'):
            result += "\nInstructors:\n"
            for teacher in course.teachers:
                result += f"- {getattr(teacher, 'display_name', 'Unknown')}\n"
        
        # Add syllabus if available (convert HTML to text)
        if hasattr(course, 'syllabus_body') and course.syllabus_body:
            syllabus_text = html_to_text(course.syllabus_body)
            
            # Check if syllabus is too long, and truncate if necessary
            if len(syllabus_text) > 1000:
                syllabus_text = syllabus_text[:1000] + "...\n[Syllabus truncated due to length]"
            
            result += "\nSyllabus:\n" + syllabus_text + "\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting course details: {str(e)}"

###########################################
# Assignment Tools
###########################################

@function_tool
def list_assignments(
    course_id: str,
    include_past_assignments: bool,
    order_by: str
) -> str:
    """List all assignments for a specific course
    
    Args:
        course_id: The Canvas course ID
        include_past_assignments: Whether to include past assignments (true/false)
        order_by: How to order the assignments ('due_at', 'title', 'created_at')
    
    Returns:
        A formatted string with the list of assignments
    """
    try:
        # Get the Canvas client
        canvas = get_canvas_client()
        
        # Get course
        course = canvas.get_course(course_id)
        
        # Get assignments
        assignments = course.get_assignments()
        
        # Filter and sort assignments
        now = datetime.now(pytz.UTC)
        filtered_assignments = []
        
        for assignment in assignments:
            # Skip if it's a past assignment and we don't want to include them
            if not include_past_assignments:
                if hasattr(assignment, 'due_at') and assignment.due_at:
                    due_date = datetime.fromisoformat(assignment.due_at.replace('Z', '+00:00'))
                    if due_date < now:
                        continue
            
            filtered_assignments.append(assignment)
        
        # Sort assignments
        if order_by == "title":
            filtered_assignments.sort(key=lambda a: getattr(a, 'name', '').lower())
        elif order_by == "created_at":
            filtered_assignments.sort(key=lambda a: getattr(a, 'created_at', ''))
        else:  # default: due_at
            # Put assignments with no due date at the end
            def get_due_date(a):
                if hasattr(a, 'due_at') and a.due_at:
                    return a.due_at
                return '9999-12-31T23:59:59Z'  # Far future date for assignments with no due date
            
            filtered_assignments.sort(key=get_due_date)
        
        # Format the results
        if not filtered_assignments:
            return f"No assignments found for course {course_id}."
        
        result = f"Assignments for {course.name}:\n"
        
        for i, assignment in enumerate(filtered_assignments, 1):
            # Get assignment details
            name = getattr(assignment, 'name', 'Unnamed Assignment')
            assignment_id = getattr(assignment, 'id', 'Unknown ID')
            points_possible = getattr(assignment, 'points_possible', 'N/A')
            
            # Format due date
            due_date = "No due date"
            if hasattr(assignment, 'due_at') and assignment.due_at:
                due_date = format_datetime(assignment.due_at)
            
            # Check submission status
            submission_status = "Not submitted"
            if hasattr(assignment, 'has_submitted_submissions') and assignment.has_submitted_submissions:
                submission_status = "Submitted"
            
            # Format assignment info
            result += f"{i}. {name}\n"
            result += f"   ID: {assignment_id}\n"
            result += f"   Due: {due_date}\n"
            result += f"   Points: {points_possible}\n"
            result += f"   Status: {submission_status}\n\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while listing assignments: {str(e)}"


@function_tool
def get_assignment_details(course_id: str, assignment_id: str) -> str:
    """Get detailed information about a specific assignment
    
    Args:
        course_id: The Canvas course ID
        assignment_id: The Canvas assignment ID
    
    Returns:
        A formatted string with detailed assignment information
    """
    try:
        # Get the Canvas client
        canvas = get_canvas_client()
        
        # Get course and assignment
        course = canvas.get_course(course_id)
        assignment = course.get_assignment(assignment_id)
        
        # Basic assignment info
        name = getattr(assignment, 'name', 'Unnamed Assignment')
        points_possible = getattr(assignment, 'points_possible', 'N/A')
        
        # Format due date
        due_date = "No due date"
        if hasattr(assignment, 'due_at') and assignment.due_at:
            due_date = format_datetime(assignment.due_at)
        
        # Format lock dates if available
        lock_date = "No lock date"
        if hasattr(assignment, 'lock_at') and assignment.lock_at:
            lock_date = format_datetime(assignment.lock_at)
        
        unlock_date = "No unlock date"
        if hasattr(assignment, 'unlock_at') and assignment.unlock_at:
            unlock_date = format_datetime(assignment.unlock_at)
        
        # Format submission types
        submission_types = "Not specified"
        if hasattr(assignment, 'submission_types'):
            types = assignment.submission_types
            if isinstance(types, list):
                submission_types = ", ".join(t.replace('_', ' ').title() for t in types)
            else:
                submission_types = str(types).replace('_', ' ').title()
        
        # Format the result
        result = f"Assignment: {name}\n"
        result += f"Course: {course.name}\n"
        result += f"ID: {assignment_id}\n"
        result += f"Points Possible: {points_possible}\n"
        result += f"Due Date: {due_date}\n"
        result += f"Available From: {unlock_date}\n"
        result += f"Available Until: {lock_date}\n"
        result += f"Submission Type: {submission_types}\n"
        
        # Add description if available (convert HTML to text)
        if hasattr(assignment, 'description') and assignment.description:
            description_text = html_to_text(assignment.description)
            
            # Check if description is too long, and truncate if necessary
            if len(description_text) > 1000:
                description_text = description_text[:1000] + "...\n[Description truncated due to length]"
            
            result += "\nDescription:\n" + description_text + "\n"
        
        # Add rubric if available
        if hasattr(assignment, 'rubric') and assignment.rubric:
            result += "\nRubric:\n"
            for criterion in assignment.rubric:
                criterion_description = criterion.get('description', 'Unnamed Criterion')
                criterion_points = criterion.get('points', 0)
                result += f"- {criterion_description} ({criterion_points} points)\n"
                
                # Add rating details if available
                ratings = criterion.get('ratings', [])
                if ratings:
                    for rating in ratings:
                        rating_description = rating.get('description', 'No description')
                        rating_points = rating.get('points', 0)
                        result += f"  * {rating_description} ({rating_points} points)\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting assignment details: {str(e)}"


@function_tool
def get_upcoming_assignments(
    days_ahead: int,
    include_all_courses: bool,
    specific_course_id: str
) -> str:
    """List assignments due soon across all courses or a specific course
    
    Args:
        days_ahead: Number of days to look ahead for assignments (e.g., 7)
        include_all_courses: Whether to include all active courses (true/false)
        specific_course_id: Course ID to filter assignments (use "0" or empty string for no filter)
    
    Returns:
        A formatted string with upcoming assignments
    """
    # Handle empty specific_course_id
    if not specific_course_id or specific_course_id == "0":
        specific_course_id = None
    try:
        # Get the Canvas client
        canvas = get_canvas_client()
        
        # Get the current user
        user = canvas.get_current_user()
        
        # Calculate the date range
        now = datetime.now(pytz.UTC)
        end_date = now + timedelta(days=days_ahead)
        
        # Get courses based on parameters
        if specific_course_id:
            courses = [canvas.get_course(specific_course_id)]
        else:
            courses = user.get_courses(enrollment_state=['active'])
        
        # Get assignments for each course and filter by due date
        upcoming_assignments = []
        
        for course in courses:
            try:
                assignments = course.get_assignments()
                
                for assignment in assignments:
                    # Skip assignments without due dates
                    if not hasattr(assignment, 'due_at') or not assignment.due_at:
                        continue
                    
                    # Parse due date
                    due_date = datetime.fromisoformat(assignment.due_at.replace('Z', '+00:00'))
                    
                    # Check if the assignment is in the date range
                    if now <= due_date <= end_date:
                        # Add course information to the assignment object
                        assignment.course_name = course.name
                        assignment.course_id = course.id
                        upcoming_assignments.append(assignment)
            except Exception as course_error:
                # Skip problematic courses but continue with others
                continue
        
        # Sort assignments by due date
        upcoming_assignments.sort(key=lambda a: a.due_at)
        
        # Format the results
        if not upcoming_assignments:
            return f"No upcoming assignments due in the next {days_ahead} days."
        
        result = f"Upcoming assignments due in the next {days_ahead} days:\n\n"
        
        for i, assignment in enumerate(upcoming_assignments, 1):
            # Get assignment details
            name = getattr(assignment, 'name', 'Unnamed Assignment')
            assignment_id = getattr(assignment, 'id', 'Unknown ID')
            course_name = getattr(assignment, 'course_name', 'Unknown Course')
            course_id = getattr(assignment, 'course_id', 'Unknown Course ID')
            points_possible = getattr(assignment, 'points_possible', 'N/A')
            
            # Format due date
            due_date = format_datetime(assignment.due_at)
            
            # Format assignment info
            result += f"{i}. {name}\n"
            result += f"   Course: {course_name} (ID: {course_id})\n"
            result += f"   Assignment ID: {assignment_id}\n"
            result += f"   Due: {due_date}\n"
            result += f"   Points: {points_possible}\n\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting upcoming assignments: {str(e)}"

###########################################
# Submission Tools
###########################################

@function_tool
def list_submissions(course_id: str, assignment_id: str) -> str:
    """Get submission history for an assignment
    
    Args:
        course_id: The Canvas course ID
        assignment_id: The Canvas assignment ID
    
    Returns:
        A formatted string with submission history
    """
    try:
        # Get the Canvas client
        canvas = get_canvas_client()
        
        # Get course and assignment
        course = canvas.get_course(course_id)
        assignment = course.get_assignment(assignment_id)
        
        # Get current user
        user = canvas.get_current_user()
        
        # Get submissions for this user
        submission = assignment.get_submission(user.id)
        
        # Basic information
        assignment_name = getattr(assignment, 'name', 'Unnamed Assignment')
        
        # Format the result
        result = f"Submission history for '{assignment_name}':\n"
        
        # Check if there's a submission
        if not hasattr(submission, 'submitted_at') or not submission.submitted_at:
            return result + "No submission found for this assignment."
        
        # Submission details
        submission_date = format_datetime(submission.submitted_at)
        submission_type = getattr(submission, 'submission_type', 'Unknown type')
        
        # Format submission type
        if submission_type:
            submission_type = submission_type.replace('_', ' ').title()
        
        # Grading status
        workflow_state = getattr(submission, 'workflow_state', 'unsubmitted')
        grading_status = workflow_state.replace('_', ' ').title()
        
        # Score details
        score = getattr(submission, 'score', None)
        points_possible = getattr(assignment, 'points_possible', 0)
        
        score_text = "Not graded"
        if score is not None:
            score_text = f"{score}/{points_possible}"
        
        # Format submission info
        result += f"Submitted: {submission_date}\n"
        result += f"Type: {submission_type}\n"
        result += f"Status: {grading_status}\n"
        result += f"Score: {score_text}\n"
        
        # Add submission content if available
        if hasattr(submission, 'body') and submission.body:
            body_text = html_to_text(submission.body)
            
            # Truncate if too long
            if len(body_text) > 500:
                body_text = body_text[:500] + "...\n[Content truncated due to length]"
            
            result += "\nSubmission Content:\n" + body_text + "\n"
        
        # Check for submission comments
        if hasattr(submission, 'submission_comments'):
            comments = submission.submission_comments
            if comments:
                result += "\nComments:\n"
                for comment in comments:
                    author = comment.get('author_name', 'Unknown')
                    comment_date = format_datetime(comment.get('created_at', ''))
                    comment_text = html_to_text(comment.get('comment', ''))
                    
                    result += f"- {author} ({comment_date}):\n  {comment_text}\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while listing submission history: {str(e)}"


@function_tool
def get_submission_feedback(course_id: str, assignment_id: str) -> str:
    """Get instructor feedback on submissions
    
    Args:
        course_id: The Canvas course ID
        assignment_id: The Canvas assignment ID
    
    Returns:
        A formatted string with instructor feedback
    """
    try:
        # Get the Canvas client
        canvas = get_canvas_client()
        
        # Get course and assignment
        course = canvas.get_course(course_id)
        assignment = course.get_assignment(assignment_id)
        
        # Get current user
        user = canvas.get_current_user()
        
        # Get submission for this user
        submission = assignment.get_submission(user.id)
        
        # Basic information
        assignment_name = getattr(assignment, 'name', 'Unnamed Assignment')
        
        # Format the result
        result = f"Feedback for '{assignment_name}':\n"
        
        # Check if there's a submission
        if not hasattr(submission, 'submitted_at') or not submission.submitted_at:
            return result + "No submission found for this assignment."
        
        # Grading status
        workflow_state = getattr(submission, 'workflow_state', 'unsubmitted')
        if workflow_state not in ['graded', 'complete']:
            return result + "This submission has not been graded yet."
        
        # Score details
        score = getattr(submission, 'score', None)
        points_possible = getattr(assignment, 'points_possible', 0)
        
        if score is not None:
            result += f"Score: {score}/{points_possible}\n"
        
        # Check for submission comments
        if hasattr(submission, 'submission_comments'):
            comments = submission.submission_comments
            if comments:
                result += "\nInstructor Comments:\n"
                for comment in comments:
                    # Filter to only show instructor comments
                    if comment.get('author_id') != user.id:
                        author = comment.get('author_name', 'Instructor')
                        comment_date = format_datetime(comment.get('created_at', ''))
                        comment_text = html_to_text(comment.get('comment', ''))
                        
                        result += f"- {author} ({comment_date}):\n  {comment_text}\n\n"
            else:
                result += "\nNo instructor comments found.\n"
        
        # Check for rubric assessment
        if hasattr(submission, 'rubric_assessment'):
            assessment = submission.rubric_assessment
            if assessment:
                result += "\nRubric Assessment:\n"
                
                # Get the rubric from the assignment to map IDs to descriptions
                rubric_map = {}
                if hasattr(assignment, 'rubric'):
                    for criterion in assignment.rubric:
                        criterion_id = criterion.get('id')
                        criterion_desc = criterion.get('description', 'Unnamed Criterion')
                        criterion_points = criterion.get('points', 0)
                        
                        # Create a map of ratings for this criterion
                        ratings_map = {}
                        for rating in criterion.get('ratings', []):
                            rating_id = rating.get('id')
                            rating_desc = rating.get('description', 'No description')
                            rating_points = rating.get('points', 0)
                            ratings_map[rating_id] = {'description': rating_desc, 'points': rating_points}
                        
                        rubric_map[criterion_id] = {
                            'description': criterion_desc,
                            'points': criterion_points,
                            'ratings': ratings_map
                        }
                
                # Process each criterion in the assessment
                for criterion_id, assessment_data in assessment.items():
                    if criterion_id in rubric_map:
                        criterion = rubric_map[criterion_id]
                        criterion_desc = criterion['description']
                        criterion_points = criterion['points']
                        
                        # Get the rating information
                        points_awarded = assessment_data.get('points', 0)
                        rating_id = assessment_data.get('rating_id')
                        rating_desc = "No rating description available"
                        
                        if rating_id and rating_id in criterion['ratings']:
                            rating_desc = criterion['ratings'][rating_id]['description']
                        
                        # Add the criterion assessment
                        result += f"- {criterion_desc}:\n"
                        result += f"  Rating: {rating_desc}\n"
                        result += f"  Points: {points_awarded}/{criterion_points}\n"
                        
                        # Add comments if available
                        comments = assessment_data.get('comments')
                        if comments:
                            result += f"  Comments: {comments}\n"
                        
                        result += "\n"
                    else:
                        # If we don't have rubric information, just show what we know
                        points = assessment_data.get('points', 0)
                        comments = assessment_data.get('comments', 'No comments')
                        
                        result += f"- Criterion {criterion_id}:\n"
                        result += f"  Points: {points}\n"
                        if comments:
                            result += f"  Comments: {comments}\n"
                        
                        result += "\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting submission feedback: {str(e)}"

###########################################
# Content Tools
###########################################

@function_tool
def get_course_materials(course_id: str) -> str:
    """Access course materials, files, and resources
    
    Args:
        course_id: The Canvas course ID
    
    Returns:
        A formatted string with course materials
    """
    try:
        # Get the Canvas client
        canvas = get_canvas_client()
        
        # Get course
        course = canvas.get_course(course_id)
        
        # Get course modules
        modules = course.get_modules()
        
        # Get course files
        files = course.get_files()
        
        # Format the result
        result = f"Course Materials for {course.name}:\n\n"
        
        # First, list modules and their items
        result += "MODULES:\n"
        
        module_count = 0
        for module in modules:
            module_count += 1
            module_name = getattr(module, 'name', f'Module {module_count}')
            
            result += f"{module_count}. {module_name}\n"
            
            # Get module items
            try:
                items = module.get_module_items()
                item_count = 0
                
                for item in items:
                    item_count += 1
                    item_name = getattr(item, 'title', f'Item {item_count}')
                    item_type = getattr(item, 'type', 'unknown')
                    
                    # Format the type
                    if item_type:
                        item_type = item_type.replace('_', ' ').title()
                    
                    result += f"   {module_count}.{item_count} {item_name} ({item_type})\n"
            except:
                result += "   [Unable to retrieve module items]\n"
            
            result += "\n"
        
        if module_count == 0:
            result += "No modules found for this course.\n\n"
        
        # Then, list files
        result += "FILES:\n"
        
        file_count = 0
        for file in files:
            file_count += 1
            file_name = getattr(file, 'filename', f'File {file_count}')
            file_type = getattr(file, 'content-type', 'unknown')
            file_size = getattr(file, 'size', 0)
            
            # Convert size to a human-readable format
            size_str = f"{file_size} bytes"
            if file_size >= 1024*1024:
                size_str = f"{file_size/(1024*1024):.1f} MB"
            elif file_size >= 1024:
                size_str = f"{file_size/1024:.1f} KB"
            
            # Format updated date
            updated_at = "Unknown date"
            if hasattr(file, 'updated_at') and file.updated_at:
                updated_at = format_datetime(file.updated_at)
            
            result += f"{file_count}. {file_name}\n"
            result += f"   Type: {file_type}\n"
            result += f"   Size: {size_str}\n"
            result += f"   Updated: {updated_at}\n\n"
        
        if file_count == 0:
            result += "No files found for this course.\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting course materials: {str(e)}"


@function_tool
def get_announcements(
    course_id: str,
    limit: int,
    include_all_courses: bool
) -> str:
    """Access course announcements
    
    Args:
        course_id: Specific Canvas course ID (use "0" or empty string if checking all courses)
        limit: Maximum number of announcements to return (e.g., 5)
        include_all_courses: Whether to include announcements from all active courses (true/false)
    
    Returns:
        A formatted string with course announcements
    """
    # Handle empty course_id
    if not course_id or course_id == "0":
        course_id = None
    try:
        # Get the Canvas client
        canvas = get_canvas_client()
        
        # Get announcements based on parameters
        if include_all_courses:
            user = canvas.get_current_user()
            courses = user.get_courses(enrollment_state=['active'])
            course_ids = [course.id for course in courses]
        elif course_id:
            course_ids = [course_id]
            # Verify the course exists
            course = canvas.get_course(course_id)  # This will raise an error if the course doesn't exist
        else:
            return "Error: Either specify a course_id or set include_all_courses to True."
        
        # Get announcements
        announcements = []
        
        for c_id in course_ids:
            try:
                course = canvas.get_course(c_id)
                course_announcements = course.get_discussion_topics(only_announcements=True)
                
                # Add course information to each announcement
                for announcement in course_announcements:
                    announcement.course_name = course.name
                    announcement.course_id = course.id
                    announcements.append(announcement)
            except:
                # Skip problematic courses but continue with others
                continue
        
        # Sort announcements by posted date (newest first)
        announcements.sort(key=lambda a: getattr(a, 'posted_at', ''), reverse=True)
        
        # Limit the number of announcements
        announcements = announcements[:limit]
        
        # Format the results
        if not announcements:
            return "No announcements found."
        
        result = f"Recent Announcements:\n\n"
        
        for i, announcement in enumerate(announcements, 1):
            # Get announcement details
            title = getattr(announcement, 'title', 'Untitled Announcement')
            course_name = getattr(announcement, 'course_name', 'Unknown Course')
            
            # Format posted date
            posted_date = "Unknown date"
            if hasattr(announcement, 'posted_at') and announcement.posted_at:
                posted_date = format_datetime(announcement.posted_at)
            
            # Format author name
            author = "Unknown"
            if hasattr(announcement, 'author'):
                author = getattr(announcement.author, 'display_name', 'Unknown')
            
            # Format announcement content (convert HTML to text)
            message = ""
            if hasattr(announcement, 'message') and announcement.message:
                message = html_to_text(announcement.message)
                
                # Truncate if too long
                if len(message) > 500:
                    message = message[:500] + "...\n[Content truncated due to length]"
            
            # Format announcement info
            result += f"{i}. {title}\n"
            result += f"   Course: {course_name}\n"
            result += f"   Posted by: {author} on {posted_date}\n"
            result += f"   Message:\n   {message}\n\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting announcements: {str(e)}"


@function_tool
def get_discussion_topics(
    course_id: str,
    include_student_posts: bool,
    limit: int
) -> str:
    """Access course discussion topics
    
    Args:
        course_id: The Canvas course ID
        include_student_posts: Whether to include topics created by students (true/false)
        limit: Maximum number of topics to return (e.g., 5)
    
    Returns:
        A formatted string with discussion topics
    """
    try:
        # Get the Canvas client
        canvas = get_canvas_client()
        
        # Get course
        course = canvas.get_course(course_id)
        
        # Get discussion topics
        topics = course.get_discussion_topics(only_announcements=False)
        
        # Filter out announcements if necessary
        filtered_topics = []
        for topic in topics:
            # Check if it's a student post and we're including those
            if not include_student_posts:
                # Skip if it's a student post
                if hasattr(topic, 'user_id') and topic.user_id:
                    current_user = canvas.get_current_user()
                    if topic.user_id == current_user.id:
                        continue
                    
                    # Try to check if the author is a student
                    # This is imperfect but a reasonable heuristic
                    if hasattr(topic, 'author') and topic.author:
                        author_roles = getattr(topic.author, 'enrollments', [])
                        is_student = False
                        for role in author_roles:
                            if role.get('type', '').lower() == 'student':
                                is_student = True
                                break
                        
                        if is_student:
                            continue
            
            filtered_topics.append(topic)
        
        # Sort by recent activity
        filtered_topics.sort(key=lambda t: getattr(t, 'last_reply_at', 
                                                  getattr(t, 'posted_at', '')), 
                            reverse=True)
        
        # Limit the number of topics
        filtered_topics = filtered_topics[:limit]
        
        # Format the results
        if not filtered_topics:
            return f"No discussion topics found for course {course_id}."
        
        result = f"Discussion Topics for {course.name}:\n\n"
        
        for i, topic in enumerate(filtered_topics, 1):
            # Get topic details
            title = getattr(topic, 'title', 'Untitled Topic')
            
            # Format posted date
            posted_date = "Unknown date"
            if hasattr(topic, 'posted_at') and topic.posted_at:
                posted_date = format_datetime(topic.posted_at)
            
            # Format last reply date
            last_reply = "No replies"
            if hasattr(topic, 'last_reply_at') and topic.last_reply_at:
                last_reply = f"Last reply: {format_datetime(topic.last_reply_at)}"
            
            # Format author name
            author = "Unknown"
            if hasattr(topic, 'author'):
                author = getattr(topic.author, 'display_name', 'Unknown')
            
            # Get reply count
            reply_count = getattr(topic, 'discussion_subentry_count', 0)
            
            # Format message preview (convert HTML to text)
            message = ""
            if hasattr(topic, 'message') and topic.message:
                message = html_to_text(topic.message)
                
                # Truncate if too long
                if len(message) > 300:
                    message = message[:300] + "...\n[Content truncated due to length]"
            
            # Format topic info
            result += f"{i}. {title}\n"
            result += f"   Posted by: {author} on {posted_date}\n"
            result += f"   Replies: {reply_count} ({last_reply})\n"
            if message:
                result += f"   Preview:\n   {message}\n\n"
            else:
                result += "\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting discussion topics: {str(e)}"

###########################################
# Grade Tools
###########################################

@function_tool
def get_grades(course_id: str) -> str:
    """Access grades for a specific course
    
    Args:
        course_id: The Canvas course ID
    
    Returns:
        A formatted string with grades for the course
    """
    try:
        # Get the Canvas client
        canvas = get_canvas_client()
        
        # Get course
        course = canvas.get_course(course_id)
        
        # Get current user
        user = canvas.get_current_user()
        
        # Get enrollments to find grades
        enrollments = user.get_enrollments()
        course_enrollment = None
        
        for enrollment in enrollments:
            if enrollment.course_id == int(course_id):
                course_enrollment = enrollment
                break
        
        if not course_enrollment:
            return f"No enrollment found for course {course_id}."
        
        # Format the result
        result = f"Grades for {course.name}:\n\n"
        
        # Overall course grade
        current_grade = getattr(course_enrollment, 'grades', {}).get('current_grade')
        current_score = getattr(course_enrollment, 'grades', {}).get('current_score')
        
        if current_grade or current_score:
            result += "Overall Course Grade:\n"
            if current_grade:
                result += f"Letter Grade: {current_grade}\n"
            if current_score:
                result += f"Percentage: {current_score}%\n"
        else:
            result += "Overall Course Grade: Not available\n"
        
        # Get assignments with scores
        submissions = []
        
        # Get all assignments for the course
        assignments = course.get_assignments()
        
        for assignment in assignments:
            try:
                # Get submission for this user
                submission = assignment.get_submission(user.id)
                
                # Only include if it has been graded
                if hasattr(submission, 'score') and submission.score is not None:
                    # Add relevant information to the submission object
                    submission.assignment_name = assignment.name
                    submission.points_possible = assignment.points_possible
                    submissions.append(submission)
            except:
                # Skip problematic assignments
                continue
        
        # Sort submissions by assignment name
        submissions.sort(key=lambda s: s.assignment_name.lower())
        
        # Format assignment grades
        if submissions:
            result += "\nAssignment Grades:\n"
            
            for i, submission in enumerate(submissions, 1):
                assignment_name = submission.assignment_name
                score = submission.score
                points_possible = submission.points_possible
                
                # Calculate percentage
                percentage = "N/A"
                if points_possible:
                    percentage = f"{(score/points_possible)*100:.1f}%"
                
                result += f"{i}. {assignment_name}\n"
                result += f"   Score: {score}/{points_possible} ({percentage})\n"
                
                # Add submission date if available
                if hasattr(submission, 'submitted_at') and submission.submitted_at:
                    submission_date = format_datetime(submission.submitted_at)
                    result += f"   Submitted: {submission_date}\n"
                
                # Add graded date if available
                if hasattr(submission, 'graded_at') and submission.graded_at:
                    graded_date = format_datetime(submission.graded_at)
                    result += f"   Graded: {graded_date}\n"
                
                result += "\n"
        else:
            result += "\nNo graded assignments found.\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting grades: {str(e)}"


@function_tool
def get_overall_grades() -> str:
    """Access overall grades across all courses
    
    Returns:
        A formatted string with grades for all active courses
    """
    try:
        # Get the Canvas client
        canvas = get_canvas_client()
        
        # Get current user
        user = canvas.get_current_user()
        
        # Get all enrollments
        enrollments = user.get_enrollments()
        
        # Filter to only active courses with grades
        active_enrollments = []
        for enrollment in enrollments:
            # Check if it's active
            if enrollment.enrollment_state != 'active':
                continue
            
            # Check if it has grade information
            if not hasattr(enrollment, 'grades'):
                continue
            
            active_enrollments.append(enrollment)
        
        # Sort enrollments by course name
        active_enrollments.sort(key=lambda e: getattr(e, 'course_name', '').lower())
        
        # Format the result
        if not active_enrollments:
            return "No grade information available for any courses."
        
        result = "Overall Grades for All Courses:\n\n"
        
        for i, enrollment in enumerate(active_enrollments, 1):
            # Get course information
            course_id = enrollment.course_id
            
            try:
                course = canvas.get_course(course_id)
                course_name = course.name
            except:
                course_name = f"Course {course_id}"
            
            # Get grade information
            current_grade = enrollment.grades.get('current_grade', 'N/A')
            current_score = enrollment.grades.get('current_score', 'N/A')
            final_grade = enrollment.grades.get('final_grade', 'N/A')
            final_score = enrollment.grades.get('final_score', 'N/A')
            
            # Format course grade info
            result += f"{i}. {course_name}\n"
            result += f"   Current Grade: {current_grade or 'N/A'}\n"
            result += f"   Current Score: {current_score or 'N/A'}%\n"
            
            if final_grade or final_score:
                result += f"   Final Grade: {final_grade or 'N/A'}\n"
                result += f"   Final Score: {final_score or 'N/A'}%\n"
            
            result += "\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting overall grades: {str(e)}"

###########################################
# Create Canvas Agent
###########################################

def create_canvas_agent():
    """Create a specialized Canvas agent for student academic assistance"""
    
    canvas_agent = Agent(
        name="Canvas Assistant",
        instructions="""
        You are a specialized Canvas Assistant. Your purpose is to help students 
        access and understand their Canvas LMS information, assignments, and grades.
        
        When handling Canvas-related requests:
        1. Help students navigate their courses, assignments, and grades
        2. Provide clear information about upcoming assignments and deadlines
        3. Offer assistance understanding assignment requirements and feedback
        4. Support students in managing their academic responsibilities
        
        You have access to tools for:
        - Viewing course information and materials
        - Checking assignment details and deadlines
        - Reviewing submission history and feedback
        - Accessing grades and academic progress
        
        IMPORTANT NOTE ABOUT USING TOOLS:
        - All tools require explicit values for each parameter - there are no optional parameters
        - For boolean parameters, always specify true or false explicitly
        - For list_courses, always specify include_past_courses (true/false)
        - For list_assignments, provide values for include_past_assignments and order_by
        - For get_upcoming_assignments, if no specific course is requested, use "0" for specific_course_id
        - For get_announcements, if no specific course is requested, use "0" for course_id
        - When in doubt, provide explicit values for all parameters required by each tool
        
        When assisting with assignments:
        - Clarify assignment requirements and rubrics
        - Provide guidance on approaching assignments
        - Help interpret instructor feedback
        - Support time management and prioritization
        
        Always maintain academic integrity:
        - Do not complete assignments for students
        - Focus on helping students understand material
        - Encourage critical thinking and learning
        - Support proper citation and academic honesty
        
        After assisting with Canvas information, summarize key points and deadlines clearly.
        """,
        tools=[
            # Course management tools
            list_courses,
            get_course_details,
            
            # Assignment tools
            list_assignments,
            get_assignment_details,
            get_upcoming_assignments,
            
            # Submission tools
            list_submissions,
            get_submission_feedback,
            
            # Content tools
            get_course_materials,
            get_announcements,
            get_discussion_topics,
            
            # Grade tools
            get_grades,
            get_overall_grades
        ],
        model_settings=ModelSettings(tool_choice="auto"),
    )
    
    return canvas_agent


# Function to be imported and called from the main script
def get_canvas_handoff():
    """Get a handoff object for the Canvas agent"""
    
    # Create the Canvas agent
    canvas_agent = create_canvas_agent()
    
    # Define callback for Canvas handoff
    def on_canvas_handoff(ctx: RunContextWrapper[Any]):
        print("[DEBUG] Handing off to Canvas Assistant...")
    
    # Create a handoff object
    from agents import handoff
    
    canvas_handoff = handoff(
        agent=canvas_agent,
        on_handoff=on_canvas_handoff,
        tool_name_override="ask_canvas_assistant",
        tool_description_override="Hand off to the Canvas Assistant for academic and course management"
    )
    
    return canvas_handoff


if __name__ == "__main__":
    # Test the Canvas agent directly if this file is run as a script
    async def test_canvas_agent():
        from agents import Runner
        
        agent = create_canvas_agent()
        
        # Example conversation
        result = await Runner.run(agent, "Show me my upcoming assignments")
        print(result.final_output)
    
    # Run the test
    asyncio.run(test_canvas_agent())
    