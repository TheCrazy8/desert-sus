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
bus_height = 60  # Make bus longer vertically
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

ad_popup_ref = {'window': None}

def popup_ad():
    global edo
    # Close previous ad if it exists
    if ad_popup_ref['window'] is not None:
        try:
            ad_popup_ref['window'].destroy()
        except:
            pass
        ad_popup_ref['window'] = None

    popup_window = tk.Toplevel(root)
    ad_popup_ref['window'] = popup_window
    popup_window.wm_title("Special Offer!")
    popup_window.attributes('-topmost', True)
    max_x = max(0, root.winfo_width() - 400)
    max_y = max(0, root.winfo_height() - 120)
    popup_window.geometry(f"400x120+{root.winfo_x() + random.randint(0, max_x)}+{root.winfo_y() + random.randint(0, max_y)}")

    # Annoying: shake window
    def shake():
        for _ in range(10):
            dx = random.randint(-10, 10)
            dy = random.randint(-10, 10)
            popup_window.geometry(f"400x120+{root.winfo_x() + random.randint(0, max_x) + dx}+{root.winfo_y() + random.randint(0, max_y) + dy}")
            popup_window.update()
            popup_window.after(30)
    shake()

    # Annoying: play bell sound (if available)
    try:
        popup_window.bell()
    except:
        pass

    # Annoying: change background color rapidly
    annoying_colors = ["#fffbe6", "#ffcccc", "#ccffcc", "#ccccff", "#ffff99", "#ff99ff", "#99ffff"]
    def color_flash(count=0):
        popup_window.configure(bg=random.choice(annoying_colors))
        if count < 10:
            popup_window.after(60, lambda: color_flash(count+1))
        else:
            popup_window.configure(bg="#fffbe6")
    color_flash()

    # Improved ad text
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
    eggo = f"🔥 {random_adj.upper()} {random_verb.upper()} {random_noun.upper()}™ 🔥\nBuy now at www.soundproofmichael.wave!"  # More visual
    edo += 1
    if eggo.lower().startswith("🔥 soundproof michael wave™"):
        eggo = f"🔥 SOUNDPROOF MICHAEL WAVE™ 🔥\nBuy now at www.soundproofmichael.wave!\nIt took {edo} ads to get THE TRUE AD."


    label = tk.Label(popup_window, text=eggo, font=("Comic Sans MS", 14, "bold"), fg="#d2691e", bg="#fffbe6", wraplength=380, justify="center")
    label.pack(pady=10, padx=10, fill="both", expand=True)

    # Annoying: spawn multiple X buttons that teleport
    x_escape_count = {'count': 0}
    x_buttons = []
    def teleport_x(btn, event=None):
        btn_width = 80
        btn_height = 30
        max_xb = 400 - btn_width
        max_yb = 120 - btn_height
        new_x = random.randint(0, max_xb)
        new_y = random.randint(0, max_yb)
        btn.place(x=new_x, y=new_y)
        x_escape_count['count'] += 1
        # Randomly close if escaped enough
        if x_escape_count['count'] >= random.randint(5, 12):
            popup_window.destroy()

    for i in range(random.randint(2, 5)):
        close_button = tk.Button(popup_window, text="✖", font=("Arial", 16, "bold"), bg="#ffe4b5", fg="#333", relief="raised", bd=3, command=lambda: popup_window.destroy())
        close_button.place(x=random.randint(0, 320), y=random.randint(0, 90), width=80, height=30)
        close_button.bind('<Enter>', lambda e, btn=close_button: teleport_x(btn, e))
        x_buttons.append(close_button)

    # Remove window close button (force only custom X)
    popup_window.protocol("WM_DELETE_WINDOW", lambda: None)

    # Make sure popup stays above game window
    popup_window.lift()
    popup_window.focus_force()

    root.after(random.randint(2000, 8000), popup_ad)

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

        # Random breakdown chance (1/1,000,000 per move)
    if random.random() < 0.0000001:
        game_vars["game_over"] = True
        game_over_screen("BREAKDOWN!")
        return

        # Random dysentry chance (1/1,000,000 per move)
    if random.random() < 0.0000001:
        game_vars["game_over"] = True
        game_over_screen("You died of dysentry!")
        return

    # Only move sideways if steered or veered
    moved = False
    # Veer off occasionally
    if random.random() < 0.05:
        direction = random.choice([-1, 1])
        game_vars["bus_x"] += direction * bus_speed
        moved = True
    # Steer if facing is set by user
    elif game_vars["facing"] != 0:
        game_vars["bus_x"] += game_vars["facing"] * bus_speed
        moved = True
    # Reset facing after move so bus only moves when key is pressed
    game_vars["facing"] = 0

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
    # Randomly invert steering (10% chance)
    invert = random.random() < 0.1
    if event.keysym == 'Left':
        game_vars["facing"] = 1 if invert else -1
    elif event.keysym == 'Right':
        game_vars["facing"] = -1 if invert else 1
    elif event.keysym == 'Escape':
        root.destroy()

root.bind('<KeyPress>', key_press)

popup_ad()  # Start the first ad popup
move_bus()  # Start game loop
root.mainloop()
