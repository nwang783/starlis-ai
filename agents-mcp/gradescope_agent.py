"""
Gradescope Integration Agent for the Personal Assistant

This module provides a Gradescope integration that allows students
to access their courses, assignments, submissions, and grades.
"""

import os
from typing import List, Dict, Any
from datetime import datetime, timedelta

# Agent SDK imports
from agents import Agent, function_tool, RunContextWrapper
from agents.model_settings import ModelSettings

# Gradescope API imports
from gradescopeapi.classes.connection import GSConnection

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Environment variables for Gradescope
GRADESCOPE_EMAIL = os.environ.get("GRADESCOPE_EMAIL")
GRADESCOPE_PASSWORD = os.environ.get("GRADESCOPE_PASSWORD")

###########################################
# Gradescope API Client Setup
###########################################

def get_gradescope_client():
    """Get an authenticated Gradescope API client"""
    if not GRADESCOPE_EMAIL or not GRADESCOPE_PASSWORD:
        raise ValueError("Gradescope credentials not found in environment variables (GRADESCOPE_EMAIL, GRADESCOPE_PASSWORD)")
    
    connection = GSConnection()
    connection.login(GRADESCOPE_EMAIL, GRADESCOPE_PASSWORD)
    return connection

###########################################
# Course Management Tools
###########################################

@function_tool
def list_courses(include_inactive: bool) -> str:
    """List all courses the student is enrolled in
    
    Args:
        include_inactive: Whether to include past/completed courses (true/false)
    
    Returns:
        A formatted string with the list of courses
    """
    try:
        # Get the Gradescope client
        client = get_gradescope_client()
        
        # Get courses
        courses = client.account.get_courses()
        
        # Format the results
        result = "Your Gradescope Courses:\n\n"
        
        # Process instructor courses
        if "instructor" in courses and courses["instructor"]:
            result += "Courses you instruct:\n"
            course_count = 0
            for course_id, course in courses["instructor"].items():
                course_count += 1
                name = getattr(course, 'name', f"Course {course_id}")
                
                result += f"{course_count}. {name}\n"
                result += f"   ID: {course_id}\n"
                result += f"   Role: Instructor\n\n"
            
            if course_count == 0:
                result += "No instructor courses found.\n\n"
        
        # Process student courses
        if "student" in courses and courses["student"]:
            result += "Courses you're enrolled in:\n"
            course_count = 0
            for course_id, course in courses["student"].items():
                course_count += 1
                name = getattr(course, 'name', f"Course {course_id}")
                
                result += f"{course_count}. {name}\n"
                result += f"   ID: {course_id}\n"
                result += f"   Role: Student\n\n"
            
            if course_count == 0:
                result += "No student courses found.\n\n"
        
        if result == "Your Gradescope Courses:\n\n":
            result += "No courses found."
            
        return result
    
    except Exception as e:
        return f"An error occurred while listing courses: {str(e)}"


@function_tool
def get_course_details(course_id: str) -> str:
    """Get detailed information about a specific course
    
    Args:
        course_id: The Gradescope course ID
    
    Returns:
        A formatted string with course details
    """
    try:
        # Get the Gradescope client
        client = get_gradescope_client()
        
        # Get courses to find the specific one
        courses = client.account.get_courses()
        course_info = None
        role = None
        
        # Search in instructor courses
        if "instructor" in courses and course_id in courses["instructor"]:
            course_info = courses["instructor"][course_id]
            role = "Instructor"
        
        # Search in student courses if not found
        if not course_info and "student" in courses and course_id in courses["student"]:
            course_info = courses["student"][course_id]
            role = "Student"
        
        if not course_info:
            return f"Course with ID {course_id} not found."
        
        # Format the result
        name = getattr(course_info, 'name', f"Course {course_id}")
        
        result = f"Course: {name}\n"
        result += f"ID: {course_id}\n"
        result += f"Role: {role}\n\n"
        
        # Get assignments to show count
        try:
            assignments = client.account.get_assignments(course_id)
            result += f"Total Assignments: {len(assignments)}\n"
            
            # Count graded assignments
            graded_count = 0
            for assignment in assignments:
                if hasattr(assignment, 'grade') and assignment.grade is not None:
                    graded_count += 1
            
            result += f"Graded Assignments: {graded_count}\n\n"
            
            # Add additional properties from the course object if available
            for attr in dir(course_info):
                if not attr.startswith('_') and not callable(getattr(course_info, attr)):
                    try:
                        value = getattr(course_info, attr)
                        if attr not in ['name']:  # Skip name since we already used it
                            attribute_name = attr.replace('_', ' ').title()
                            result += f"{attribute_name}: {value}\n"
                    except:
                        pass
            
        except Exception as e:
            result += f"Could not retrieve assignments: {str(e)}\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting course details: {str(e)}"

###########################################
# Assignment Management Tools
###########################################

@function_tool
def list_assignments(course_id: str) -> str:
    """List all assignments for a specific course
    
    Args:
        course_id: The Gradescope course ID
    
    Returns:
        A formatted string with the list of assignments
    """
    try:
        # Get the Gradescope client
        client = get_gradescope_client()
        
        # Get course name
        courses = client.account.get_courses()
        course_name = None
        
        # Search in instructor courses
        if "instructor" in courses and course_id in courses["instructor"]:
            course = courses["instructor"][course_id]
            course_name = getattr(course, 'name', f"Course {course_id}")
        
        # Search in student courses if not found
        if not course_name and "student" in courses and course_id in courses["student"]:
            course = courses["student"][course_id]
            course_name = getattr(course, 'name', f"Course {course_id}")
        
        if not course_name:
            course_name = f"Course {course_id}"
        
        # Get assignments for the course
        assignments = client.account.get_assignments(course_id)
        
        # Format the results
        if not assignments:
            return f"No assignments found for {course_name}."
        
        result = f"Assignments for {course_name}:\n\n"
        
        for i, assignment in enumerate(assignments, 1):
            # Get assignment details
            name = getattr(assignment, 'name', f"Assignment {i}")
            assignment_id = getattr(assignment, 'assignment_id', "Unknown ID")
            
            # Format due date
            due_date = getattr(assignment, 'due_date', "No due date")
            if due_date is None:
                due_date = "No due date"
            
            # Format release date
            release_date = getattr(assignment, 'release_date', "No release date")
            if release_date is None:
                release_date = "No release date"
            
            # Get grade info if available
            grade = getattr(assignment, 'grade', None)
            max_grade = getattr(assignment, 'max_grade', None)
            grade_str = "Not graded"
            if grade is not None and max_grade is not None:
                grade_str = f"{grade}/{max_grade}"
                # Add percentage if possible
                try:
                    percentage = (float(grade) / float(max_grade)) * 100
                    grade_str += f" ({percentage:.1f}%)"
                except:
                    pass
            
            # Get submission status
            status = getattr(assignment, 'submissions_status', "Unknown status")
            
            # Format assignment info
            result += f"{i}. {name}\n"
            result += f"   ID: {assignment_id}\n"
            result += f"   Released: {release_date}\n"
            result += f"   Due: {due_date}\n"
            result += f"   Status: {status}\n"
            result += f"   Grade: {grade_str}\n\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while listing assignments: {str(e)}"


@function_tool
def get_assignment_details(course_id: str, assignment_id: str) -> str:
    """Get detailed information about a specific assignment
    
    Args:
        course_id: The Gradescope course ID
        assignment_id: The Gradescope assignment ID
    
    Returns:
        A formatted string with detailed assignment information
    """
    try:
        # Get the Gradescope client
        client = get_gradescope_client()
        
        # Get assignments for the course
        assignments = client.account.get_assignments(course_id)
        
        # Find the specific assignment
        assignment_info = None
        for assignment in assignments:
            if str(getattr(assignment, 'assignment_id', '')) == assignment_id:
                assignment_info = assignment
                break
        
        if not assignment_info:
            return f"Assignment with ID {assignment_id} not found in course {course_id}."
        
        # Format the result
        name = getattr(assignment_info, 'name', f"Assignment {assignment_id}")
        
        # Format due date
        due_date = getattr(assignment_info, 'due_date', "No due date")
        if due_date is None:
            due_date = "No due date"
        
        # Format release date
        release_date = getattr(assignment_info, 'release_date', "No release date")
        if release_date is None:
            release_date = "No release date"
        
        # Get grade info if available
        grade = getattr(assignment_info, 'grade', None)
        max_grade = getattr(assignment_info, 'max_grade', None)
        grade_str = "Not graded"
        if grade is not None and max_grade is not None:
            grade_str = f"{grade}/{max_grade}"
            # Add percentage if possible
            try:
                percentage = (float(grade) / float(max_grade)) * 100
                grade_str += f" ({percentage:.1f}%)"
            except:
                pass
        
        # Get submission status
        status = getattr(assignment_info, 'submissions_status', "Unknown status")
        
        result = f"Assignment: {name}\n"
        result += f"ID: {assignment_id}\n"
        result += f"Released: {release_date}\n"
        result += f"Due: {due_date}\n"
        result += f"Status: {status}\n"
        result += f"Grade: {grade_str}\n\n"
        
        # Add late due date if available
        late_due_date = getattr(assignment_info, 'late_due_date', None)
        if late_due_date:
            result += f"Late Due Date: {late_due_date}\n"
        
        # Add all other attributes
        for attr in dir(assignment_info):
            if not attr.startswith('_') and not callable(getattr(assignment_info, attr)):
                if attr not in ['name', 'assignment_id', 'due_date', 'release_date', 'grade', 'max_grade', 'submissions_status', 'late_due_date']:
                    try:
                        value = getattr(assignment_info, attr)
                        if value is not None:  # Only include non-None values
                            # Format attribute name
                            attribute_name = attr.replace('_', ' ').title()
                            result += f"{attribute_name}: {value}\n"
                    except:
                        pass
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting assignment details: {str(e)}"


@function_tool
def get_upcoming_assignments(days_ahead: int, include_all_courses: bool) -> str:
    """List assignments due soon across all courses
    
    Args:
        days_ahead: Number of days to look ahead for assignments
        include_all_courses: Whether to include all courses (true/false)
    
    Returns:
        A formatted string with upcoming assignments
    """
    try:
        # Get the Gradescope client
        client = get_gradescope_client()
        
        # Get all courses
        courses = client.account.get_courses()
        
        # Determine which courses to check
        courses_to_check = []
        
        # Add instructor courses if requested
        if include_all_courses and "instructor" in courses:
            for course_id, course in courses["instructor"].items():
                courses_to_check.append((course_id, course))
        
        # Add student courses
        if "student" in courses:
            for course_id, course in courses["student"].items():
                courses_to_check.append((course_id, course))
        
        # Calculate cutoff date
        now = datetime.now()
        cutoff = now + timedelta(days=days_ahead)
        
        # Find upcoming assignments
        upcoming_assignments = []
        
        for course_id, course in courses_to_check:
            course_name = getattr(course, 'name', f"Course {course_id}")
            
            try:
                # Get assignments for this course
                assignments = client.account.get_assignments(course_id)
                
                for assignment in assignments:
                    # Add course information
                    assignment_with_course = {
                        'course_id': course_id,
                        'course_name': course_name,
                        'assignment': assignment
                    }
                    
                    # Check if due date exists and is within range
                    due_date = getattr(assignment, 'due_date', None)
                    if due_date:
                        try:
                            # Try to parse the due date (format might vary)
                            parsed_date = None
                            
                            # Try different formats based on what we observe
                            if isinstance(due_date, datetime):
                                parsed_date = due_date
                            elif isinstance(due_date, str):
                                try:
                                    # Try ISO format
                                    if 'T' in due_date:
                                        parsed_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                                    else:
                                        # Try simple date format
                                        parsed_date = datetime.strptime(due_date, "%Y-%m-%d")
                                except ValueError:
                                    # Try other common formats
                                    try:
                                        parsed_date = datetime.strptime(due_date, "%b %d, %Y")
                                    except ValueError:
                                        try:
                                            parsed_date = datetime.strptime(due_date, "%d %b %Y")
                                        except ValueError:
                                            # Skip if we can't parse the date
                                            continue
                            
                            # If due date is in the future and within range, add to list
                            if parsed_date and now <= parsed_date <= cutoff:
                                upcoming_assignments.append(assignment_with_course)
                                
                        except Exception:
                            # Skip this assignment if date parsing fails
                            continue
            
            except Exception:
                # Skip this course if we can't get assignments
                continue
        
        # Format the results
        if not upcoming_assignments:
            return f"No upcoming assignments due in the next {days_ahead} days."
        
        # Sort by due date if possible
        try:
            upcoming_assignments.sort(key=lambda x: getattr(x['assignment'], 'due_date', ''))
        except:
            # Skip sorting if it fails
            pass
        
        result = f"Upcoming assignments due in the next {days_ahead} days:\n\n"
        
        for i, item in enumerate(upcoming_assignments, 1):
            assignment = item['assignment']
            course_name = item['course_name']
            course_id = item['course_id']
            
            # Get assignment details
            name = getattr(assignment, 'name', f"Assignment {i}")
            assignment_id = getattr(assignment, 'assignment_id', "Unknown ID")
            
            # Format due date
            due_date = getattr(assignment, 'due_date', "Unknown due date")
            
            # Format assignment info
            result += f"{i}. {name}\n"
            result += f"   Course: {course_name} (ID: {course_id})\n"
            result += f"   Assignment ID: {assignment_id}\n"
            result += f"   Due: {due_date}\n\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting upcoming assignments: {str(e)}"

###########################################
# Grade Management Tools
###########################################

@function_tool
def get_grades(course_id: str) -> str:
    """Get grades for a specific course
    
    Args:
        course_id: The Gradescope course ID
    
    Returns:
        A formatted string with grades for the course
    """
    try:
        # Get the Gradescope client
        client = get_gradescope_client()
        
        # Get course name
        courses = client.account.get_courses()
        course_name = None
        
        # Search in instructor courses
        if "instructor" in courses and course_id in courses["instructor"]:
            course = courses["instructor"][course_id]
            course_name = getattr(course, 'name', f"Course {course_id}")
        
        # Search in student courses if not found
        if not course_name and "student" in courses and course_id in courses["student"]:
            course = courses["student"][course_id]
            course_name = getattr(course, 'name', f"Course {course_id}")
        
        if not course_name:
            course_name = f"Course {course_id}"
        
        # Get assignments for the course
        assignments = client.account.get_assignments(course_id)
        
        # Format the results
        if not assignments:
            return f"No assignments found for {course_name}."
        
        result = f"Grades for {course_name}:\n\n"
        
        # Filter to only include graded assignments
        graded_assignments = []
        for assignment in assignments:
            if hasattr(assignment, 'grade') and assignment.grade is not None:
                graded_assignments.append(assignment)
        
        if not graded_assignments:
            return f"No graded assignments found for {course_name}."
        
        # Calculate course average if possible
        total_score = 0
        total_max = 0
        for assignment in graded_assignments:
            if hasattr(assignment, 'grade') and hasattr(assignment, 'max_grade'):
                if assignment.grade is not None and assignment.max_grade is not None:
                    try:
                        total_score += float(assignment.grade)
                        total_max += float(assignment.max_grade)
                    except:
                        pass
        
        if total_max > 0:
            overall_percentage = (total_score / total_max) * 100
            result += f"Overall: {total_score}/{total_max} ({overall_percentage:.1f}%)\n\n"
        
        # Format the grades
        result += "Assignment Grades:\n"
        for i, assignment in enumerate(graded_assignments, 1):
            name = getattr(assignment, 'name', f"Assignment {i}")
            grade = getattr(assignment, 'grade', "Not graded")
            max_grade = getattr(assignment, 'max_grade', "Unknown")
            
            # Calculate percentage if possible
            percentage = ""
            if grade != "Not graded" and max_grade != "Unknown":
                try:
                    pct = (float(grade) / float(max_grade)) * 100
                    percentage = f" ({pct:.1f}%)"
                except:
                    pass
            
            result += f"{i}. {name}\n"
            result += f"   Score: {grade}/{max_grade}{percentage}\n\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting grades: {str(e)}"


@function_tool
def get_overall_grades() -> str:
    """Get overall grades across all courses
    
    Returns:
        A formatted string with grades for all courses
    """
    try:
        # Get the Gradescope client
        client = get_gradescope_client()
        
        # Get all courses
        courses = client.account.get_courses()
        
        # Find all courses
        all_courses = []
        
        # Add instructor courses
        if "instructor" in courses:
            for course_id, course in courses["instructor"].items():
                all_courses.append({
                    'id': course_id,
                    'name': getattr(course, 'name', f"Course {course_id}"),
                    'role': "Instructor"
                })
        
        # Add student courses
        if "student" in courses:
            for course_id, course in courses["student"].items():
                all_courses.append({
                    'id': course_id,
                    'name': getattr(course, 'name', f"Course {course_id}"),
                    'role': "Student"
                })
        
        if not all_courses:
            return "No courses found."
        
        # Format the results
        result = "Overall Grades Summary:\n\n"
        
        # Track if we found any grades
        found_grades = False
        
        # Get grades for each course
        for course in all_courses:
            course_id = course['id']
            course_name = course['name']
            
            try:
                # Get assignments for this course
                assignments = client.account.get_assignments(course_id)
                
                # Filter to only include graded assignments
                graded_assignments = []
                for assignment in assignments:
                    if hasattr(assignment, 'grade') and assignment.grade is not None:
                        graded_assignments.append(assignment)
                
                if graded_assignments:
                    found_grades = True
                    
                    # Calculate course average
                    total_score = 0
                    total_max = 0
                    for assignment in graded_assignments:
                        if hasattr(assignment, 'grade') and hasattr(assignment, 'max_grade'):
                            if assignment.grade is not None and assignment.max_grade is not None:
                                try:
                                    total_score += float(assignment.grade)
                                    total_max += float(assignment.max_grade)
                                except:
                                    pass
                    
                    # Format the course grade
                    result += f"{course_name}:\n"
                    
                    if total_max > 0:
                        overall_percentage = (total_score / total_max) * 100
                        result += f"Overall: {total_score}/{total_max} ({overall_percentage:.1f}%)\n"
                    
                    result += f"Graded Assignments: {len(graded_assignments)}\n\n"
            
            except Exception as e:
                result += f"{course_name}: Error retrieving grades - {str(e)}\n\n"
        
        if not found_grades:
            result += "No grades found in any courses."
        
        return result
    
    except Exception as e:
        return f"An error occurred while getting overall grades: {str(e)}"

###########################################
# Create Gradescope Agent
###########################################

def create_gradescope_agent():
    """Create a specialized Gradescope agent for student academic assistance"""
    
    gradescope_agent = Agent(
        name="Gradescope Assistant",
        instructions="""
        You are a specialized Gradescope Assistant. Your purpose is to help students 
        access their Gradescope information, including courses, assignments, and grades.
        
        When handling Gradescope-related requests:
        1. Help students navigate their courses and assignments
        2. Provide clear information about upcoming assignment deadlines
        3. Assist with checking grades and assignment feedback
        4. Support students in managing their academic responsibilities
        
        IMPORTANT NOTE ABOUT USING TOOLS:
        - All tools require explicit values for each parameter
        - For boolean parameters, always specify true or false explicitly
        - When in doubt, provide explicit values for all parameters
        
        When assisting with assignments:
        - Clarify assignment requirements and deadlines
        - Help check submission status
        - Support time management and assignment prioritization
        
        Always maintain academic integrity:
        - Do not help students circumvent submission requirements or deadlines
        - Focus on helping students understand assignment requirements
        - Encourage proper academic practices
        
        After providing Gradescope information, summarize key points clearly.
        """,
        tools=[
            # Course management tools
            list_courses,
            get_course_details,
            
            # Assignment tools
            list_assignments,
            get_assignment_details,
            get_upcoming_assignments,
            
            # Grade tools
            get_grades,
            get_overall_grades
        ],
        model_settings=ModelSettings(tool_choice="auto"),
    )
    
    return gradescope_agent


# Function to be imported and called from the main script
def get_gradescope_handoff():
    """Get a handoff object for the Gradescope agent"""
    
    # Create the Gradescope agent
    gradescope_agent = create_gradescope_agent()
    
    # Define callback for Gradescope handoff
    def on_gradescope_handoff(ctx: RunContextWrapper[Any]):
        print("[DEBUG] Handing off to Gradescope Assistant...")
    
    # Create a handoff object
    from agents import handoff
    
    gradescope_handoff = handoff(
        agent=gradescope_agent,
        on_handoff=on_gradescope_handoff,
        tool_name_override="ask_gradescope_assistant",
        tool_description_override="Hand off to the Gradescope Assistant for assignment and grade management"
    )
    
    return gradescope_handoff


if __name__ == "__main__":
    # Test the Gradescope agent directly if this file is run as a script
    async def test_gradescope_agent():
        from agents import Runner
        
        agent = create_gradescope_agent()
        
        # Example conversation
        result = await Runner.run(agent, "Show me my courses")
        print(result.final_output)
    
    # Run the test
    import asyncio
    asyncio.run(test_gradescope_agent())
    