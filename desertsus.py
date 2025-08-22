import time
import random
import tkinter as tk

# Constants
duration_seconds = 28800  # 8 hours
road_width = 200
window_width = 400
window_height = 300
bus_width = 40
bus_height = 20
bus_speed = 10  # pixels per move
update_interval = 100  # ms

# Game variables
bus_x = (window_width - bus_width) // 2
bus_y = window_height // 2
facing = 1  # 1 = right, -1 = left

game_over = False

def game_over_screen():
    canvas.create_text(window_width // 2, window_height // 2, text="GAME OVER", fill="red", font=('Helvetica', 24))

def move_bus():
    global bus_x, game_over
    if game_over:
        return

    # Randomly veer off occasionally
    if random.random() < 0.05:
        direction = random.choice([-1, 1])
        bus_x += direction * bus_speed
    else:
        bus_x += facing * bus_speed

    # Check if bus is off the road
    road_left = (window_width - road_width) // 2
    road_right = road_left + road_width
    if bus_x < road_left or bus_x + bus_width > road_right:
        game_over = True
        game_over_screen()
        return

    # Draw everything
    canvas.delete("all")
    # Draw road
    canvas.create_rectangle(road_left, 0, road_right, window_height, fill="gray")
    # Draw bus
    canvas.create_rectangle(bus_x, bus_y, bus_x + bus_width, bus_y + bus_height, fill="yellow")
    # Schedule next move
    root.after(update_interval, move_bus)

# Tkinter setup
root = tk.Tk()
root.title("Desert Bus")

canvas = tk.Canvas(root, width=window_width, height=window_height)
canvas.pack()

def key_press(event):
    global facing
    if event.keysym == 'Left':
        facing = -1
    elif event.keysym == 'Right':
        facing = 1

root.bind('<KeyPress>', key_press)

move_bus()  # Start game loop
root.mainloop()
