from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.http import JsonResponse
from .services.stops_service import (get_route_stops)
import requests

@api_view(["POST"])
@permission_classes([AllowAny])
def stops_view(request):

    route_points = request.data.get(
        "points",
        []
    )

    print(
        "Puntos recibidos:",
        len(route_points)
    )

    result = get_route_stops(
        route_points
    )

    return JsonResponse(result)



def search_location(request):

    query = request.GET.get("q", "")

    if len(query) < 3:
        return JsonResponse([], safe=False)

    response = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params={
            "q": query,
            "format": "json",
            "addressdetails": 1,
            "limit": 5
        },
        headers={
            "User-Agent": "ELDRoutePlanner"
        }
    )

    return JsonResponse(
        response.json(),
        safe=False
    )










class CalculateEldView(APIView):
    def post(self, request):
        try:
            distance_miles = float(request.data.get('distanceMiles', 0))
            duration_hours = float(request.data.get('durationHours', 0))
            initial_cycle_used = float(request.data.get('cycleUsed', 0))

            remaining_distance = distance_miles
            remaining_driving_time = duration_hours
            
            current_day = 1
            logs_per_day = []
            
            daily_driving = 0
            daily_duty_window = 0
            continuous_driving_since_rest = 0
            miles_since_last_fuel = 0
            total_cycle_used = initial_cycle_used
            current_time_in_day = 6.0  

            def init_new_day(day_num):
                return {
                    "day": day_num,
                    "events": [
                        {"status": "OFF_DUTY", "startTime": 0.0, "endTime": 6.0, "duration": 6.0, "reason": "Rest / Sleep"}
                    ]
                }

            current_log = init_new_day(current_day)
            
           
            current_log["events"].append({
                "status": "ON_DUTY", "startTime": current_time_in_day, 
                "endTime": current_time_in_day + 1.0, "duration": 1.0, "reason": "Pickup Operations"
            })
            current_time_in_day += 1.0
            daily_duty_window += 1.0
            total_cycle_used += 1.0

            time_step = 0.25
            average_speed = remaining_distance / remaining_driving_time if remaining_driving_time > 0 else 0

            while remaining_driving_time > 0:
              
                if total_cycle_used >= 70:
                    current_log["events"].append({
                        "status": "OFF_DUTY", "startTime": current_time_in_day, "endTime": 24.0, 
                        "duration": 24.0 - current_time_in_day, "reason": "34-Hour Cycle Restart Required"
                    })
                    logs_per_day.append(current_log)
                    
                    current_day += 1
                    logs_per_day.append({
                        "day": current_day,
                        "events": [{"status": "OFF_DUTY", "startTime": 0.0, "endTime": 24.0, "duration": 24.0, "reason": "34-Hour Cycle Restart"}]
                    })
                    
                    current_day += 1
                    current_log = init_new_day(current_day)
                    current_time_in_day = 6.0
                    daily_driving = 0
                    daily_duty_window = 0
                    continuous_driving_since_rest = 0
                    total_cycle_used = 0
                    continue

              
                if miles_since_last_fuel >= 1000:
                    current_log["events"].append({
                        "status": "ON_DUTY", "startTime": current_time_in_day, 
                        "endTime": current_time_in_day + 0.5, "duration": 0.5, "reason": "Fueling Station Stop"
                    })
                    current_time_in_day += 0.5
                    daily_duty_window += 0.5
                    total_cycle_used += 0.5
                    miles_since_last_fuel = 0
                    continue

              
                if daily_driving >= 11.0 or daily_duty_window >= 14.0 or current_time_in_day >= 24.0:
                    rest_needed = 10.0
                    if current_time_in_day + rest_needed <= 24.0:
                        current_log["events"].append({
                            "status": "SLEEPER_BERTH", "startTime": current_time_in_day, 
                            "endTime": current_time_in_day + rest_needed, "duration": rest_needed, "reason": "Mandatory 10-Hour Rest"
                        })
                        current_time_in_day += rest_needed
                        if current_time_in_day < 24.0:
                            current_log["events"].append({"status": "OFF_DUTY", "startTime": current_time_in_day, "endTime": 24.0, "duration": 24.0 - current_time_in_day, "reason": "End of Day Rest"})
                        logs_per_day.append(current_log)
                        current_day += 1
                        current_log = init_new_day(current_day)
                        current_time_in_day = 6.0
                    else:
                        hours_this_day = 24.0 - current_time_in_day
                        hours_next_day = rest_needed - hours_this_day
                        current_log["events"].append({
                            "status": "SLEEPER_BERTH", "startTime": current_time_in_day, "endTime": 24.0, "duration": hours_this_day, "reason": "Mandatory 10-Hour Rest (Part 1)"
                        })
                        logs_per_day.append(current_log)
                        current_day += 1
                        current_log = {
                            "day": current_day,
                            "events": [{"status": "SLEEPER_BERTH", "startTime": 0.0, "endTime": hours_next_day, "duration": hours_next_day, "reason": "Mandatory 10-Hour Rest (Part 2)"}]
                        }
                        current_time_in_day = hours_next_day
                    
                    daily_driving = 0
                    daily_duty_window = 0
                    continuous_driving_since_rest = 0
                    continue

               
                if continuous_driving_since_rest >= 8.0:
                    current_log["events"].append({
                        "status": "OFF_DUTY", "startTime": current_time_in_day, 
                        "endTime": current_time_in_day + 0.5, "duration": 0.5, "reason": "Required 30-min Rest Break"
                    })
                    current_time_in_day += 0.5
                    daily_duty_window += 0.5
                    continuous_driving_since_rest = 0
                    continue

                
                last_event = current_log["events"][-1] if current_log["events"] else None
                if last_event and last_event["status"] == "DRIVING" and current_time_in_day < 24.0:
                    last_event["endTime"] += time_step
                    last_event["duration"] += time_step
                else:
                    current_log["events"].append({
                        "status": "DRIVING", "startTime": current_time_in_day, 
                        "endTime": current_time_in_day + time_step, "duration": time_step, "reason": "Driving Route Segment"
                    })

                remaining_driving_time -= time_step
                miles_driven_in_step = average_speed * time_step
                remaining_distance -= miles_driven_in_step
                miles_since_last_fuel += miles_driven_in_step
                current_time_in_day += time_step
                daily_driving += time_step
                daily_duty_window += time_step
                continuous_driving_since_rest += time_step
                total_cycle_used += time_step

           
            if current_time_in_day + 1.0 <= 24.0:
                current_log["events"].append({"status": "ON_DUTY", "startTime": current_time_in_day, "endTime": current_time_in_day + 1.0, "duration": 1.0, "reason": "Drop-off Operations"})
                current_time_in_day += 1.0
                current_log["events"].append({"status": "OFF_DUTY", "startTime": current_time_in_day, "endTime": 24.0, "duration": 24.0 - current_time_in_day, "reason": "End of Trip Rest"})
                logs_per_day.append(current_log)
            else:
                current_log["events"].append({"status": "OFF_DUTY", "startTime": current_time_in_day, "endTime": 24.0, "duration": 24.0 - current_time_in_day, "reason": "End of Day"})
                logs_per_day.append(current_log)
                current_day += 1
                logs_per_day.append({
                    "day": current_day,
                    "events": [
                        {"status": "ON_DUTY", "startTime": 0.0, "endTime": 1.0, "duration": 1.0, "reason": "Drop-off Operations"},
                        {"status": "OFF_DUTY", "startTime": 1.0, "endTime": 24.0, "duration": 23.0, "reason": "Trip Completed"}
                    ]
                })

            return Response(logs_per_day, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)