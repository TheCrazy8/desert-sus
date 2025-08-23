import time
import random
import tkinter as tk
from tkinter import ttk

edo = 0

# Constants
duration_seconds = 28800  # 8 hours
road_width = 200
window_width = 400
window_height = 300
bus_width = 40
bus_height = 20
bus_speed = 10  # pixels per move
update_interval = 100  # ms


# Game variables (will be reset)
def reset_game_vars():
    return {
        "bus_x": (window_width - bus_width) // 2,
        "bus_y": window_height // 2,
        "facing": 1,  # 1 = right, -1 = left
        "game_over": False
    }

game_vars = None  # will be set after window size is set

def popup_ad():
    global edo
    popup_window = tk.Toplevel()
    popup_window.wm_title("Pop-up Window")

    word_list = ["apple", "mountain", "computer", "river", "book", "forest", "ocean", "car", "house", "music",
    "dog", "city", "garden", "train", "cloud", "desk", "bridge", "star", "tree", "phone",
    "chair", "window", "beach", "plane", "flower", "castle", "lamp", "boat", "clock", "road",
    "school", "camera", "horse", "island", "tower", "lake", "shoe", "door", "cat", "field",
    "street", "cup", "hat", "table", "wall", "bed", "ring", "stone", "bird", "pen"]
    random_noun = random.choice(word_list)
    word_list1 = ["happy", "blue", "quick", "bright", "cold", "silent", "fuzzy", "shiny", "brave", "loud",
    "gentle", "bitter", "soft", "tall", "rough", "smooth", "tiny", "huge", "ancient", "fresh",
    "curious", "warm", "sharp", "calm", "dark", "sweet", "deep", "heavy", "light", "wild",
    "elegant", "greedy", "fragile", "bold", "lazy", "wise", "red", "green", "young", "old",
    "messy", "clean", "thick", "thin", "dull", "funny", "sad", "clear", "serious", "short"]
    random_adj = random.choice(word_list1)
    word_list2 = ["running", "jumping", "swimming", "reading", "writing", "singing", "dancing", "laughing", "drawing", "playing","walking", "talking", "cooking", "driving", "painting", "flying", "hiking", "climbing", "listening", "watching", "learning", "growing", "shopping", "building", "fixing", "teaching", "helping", "cleaning", "resting", "eating", "sleeping", "smiling", "crying", "baking", "skating", "studying", "traveling", "exploring", "gardening", "fishing", "jogging", "sewing", "hunting", "pouring", "racing", "sitting", "screaming", "staring", "feeding", "yawning"]
    random_verb = random.choice(word_list2)
    eggo = f"{random_adj} {random_verb} {random_noun}™, buy now at www.soundproofmichael.wave!".capitalize()
    edo += 1
    if eggo == "Soundproof michael wave™, buy now at www.soundproofmichael.wave!":
        eggo = f"Soundproof michael wave™, buy now at www.soundproofmichael.wave!  It took {edo} ads to get THE TRUE AD."

    label = ttk.Label(popup_window, text=eggo)
    label.pack(pady=10)

    close_button = ttk.Button(popup_window, text="Close", command=popup_window.destroy)
    close_button.pack(pady=5)
    root.after(pickrandom(10,1000000), popup_ad)

def game_over_screen(reason="GAME OVER"):
    canvas.create_text(window_width // 2, window_height // 2 - 20, text=reason, fill="red", font=('Helvetica', 24))
    canvas.create_text(window_width // 2, window_height // 2 + 20, text="Press R to Restart", fill="black", font=('Helvetica', 16))


def draw_desert(canvas, road_left, road_right, window_width, window_height):
    # Draw desert background (sand color)
    canvas.create_rectangle(0, 0, window_width, window_height, fill="#EDC9Af", outline="")
    # Add some random desert features (cacti, rocks)
    for _ in range(15):
        x = random.randint(0, window_width)
        y = random.randint(0, window_height)
        if x < road_left or x > road_right:
            # Draw cactus
            if random.random() < 0.5:
                # Main stem
                canvas.create_rectangle(x, y, x+8, y+40, fill="#228B22", outline="")
                # Left arm
                if random.random() < 0.5:
                    canvas.create_rectangle(x-6, y+15, x+2, y+25, fill="#228B22", outline="")
                # Right arm
                if random.random() < 0.5:
                    canvas.create_rectangle(x+6, y+20, x+14, y+30, fill="#228B22", outline="")
            else:
                # Draw rock
                canvas.create_oval(x, y, x+18, y+12, fill="#A0522D", outline="")

def move_bus():
    global game_vars
    if game_vars["game_over"]:
        return

    # Random breakdown chance (1/1000 per move)
    if random.random() < 0.001:
        game_vars["game_over"] = True
        game_over_screen("BREAKDOWN!")
        return

    # Randomly veer off occasionally
    if random.random() < 0.05:
        direction = random.choice([-1, 1])
        game_vars["bus_x"] += direction * bus_speed
    else:
        game_vars["bus_x"] += game_vars["facing"] * bus_speed

    # Check if bus is off the road
    road_left = (window_width - road_width) // 2
    road_right = road_left + road_width
    if game_vars["bus_x"] < road_left or game_vars["bus_x"] + bus_width > road_right:
        game_vars["game_over"] = True
        game_over_screen("OFF ROAD!")
        return

    # Draw everything
    canvas.delete("all")
    draw_desert(canvas, road_left, road_right, window_width, window_height)
    # Draw road
    canvas.create_rectangle(road_left, 0, road_right, window_height, fill="gray")
    # Draw bus
    canvas.create_rectangle(game_vars["bus_x"], game_vars["bus_y"], game_vars["bus_x"] + bus_width, game_vars["bus_y"] + bus_height, fill="yellow")
    # Schedule next move
    root.after(update_interval, move_bus)

# Tkinter setup

root = tk.Tk()
root.title("Desert Bus")
root.attributes('-fullscreen', True)

window_width = root.winfo_screenwidth()
window_height = root.winfo_screenheight()

canvas = tk.Canvas(root, width=window_width, height=window_height)
canvas.pack(fill=tk.BOTH, expand=True)

game_vars = reset_game_vars()

def key_press(event):
    global game_vars
    if game_vars["game_over"]:
        if event.keysym == 'r' or event.keysym == 'R':
            # Reset the game variables and restart
            game_vars = reset_game_vars()
            canvas.delete("all")
            move_bus()
        return
    if event.keysym == 'Left':
        game_vars["facing"] = -1
    elif event.keysym == 'Right':
        game_vars["facing"] = 1

root.bind('<KeyPress>', key_press)

move_bus()  # Start game loop
root.mainloop()
