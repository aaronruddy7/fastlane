from flask import Flask, request, jsonify, make_response, session, redirect, url_for
from pymongo import MongoClient
from bson import json_util, ObjectId
import string

import datetime
from functools import wraps
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


client = MongoClient("mongodb://127.0.0.1:27017")
app.config['SECRET_KEY'] = 'aaronruddy'


print(client.list_database_names()) # should print a list of available databases
db = client.messagingapp
print(db.list_collection_names()) # should print a list of available collections in the 'messagingapp' database
users_collection = db.users
photos_collection = db.photos
messages_collection = db.messages

@app.route('/users', methods=['GET'])
def getusers():
    # Use the find method to retrieve all users from the MongoDB collection
    all_users = users_collection.find()
    print(all_users) # should print a reference to a cursor object
    # Convert the result to a list and return it as a JSON response
    # Convert the result to a list, convert ObjectId fields to strings, and return it as a JSON response
    user_list = [user if not isinstance(user.get('_id'), ObjectId) else {**user, **{'_id': str(user['_id'])}} for user in all_users]
    return jsonify(user_list)

#get a user
@app.route('/user/<string:id>', methods=['GET'])
def getuser(id):   
    # Check if id is 24 characters longs and that all characters are in hexadecimal
    if len(id) != 24 or not all(c in string.hexdigits for c in id):
        # Display error if criteria not met
        return make_response(jsonify({"error": "Invalid user ID"}), 404)

    user = users_collection.find_one({'_id': ObjectId(id)})
    if user is not None:
        # Convert ObjectId to string
        user['_id'] = str(user['_id'])
        # Add likes, potential_matches, and matches fields
        user['likes'] = list(users_collection.find({'_id': {'$in': user['likes']}}))
        user['potential_matches'] = list(users_collection.find({'_id': {'$in': user['potential_matches']}}))
        matches = list(users_collection.find({'_id': {'$in': user['matches']}}))
        # Add first_name field for each match
        for match in matches:
            match['first_name'] = match['name'].split()[0]
        user['matches'] = matches
        return make_response(jsonify(user), 200)
    else:
        return make_response(jsonify({"error": "Invalid user ID"}), 404)

#create a user    
@app.route("/user", methods=["POST"])
def add_user():
    required_fields = ["first_name", "password", "email", "gender", "dob", "phone", "bio", "height"]
    
    if all(field in request.form for field in required_fields):
        new_user = {
            "_id" : ObjectId(),
            "first_name" : request.form["first_name"],
            "password" : request.form["password"],
            "email" : request.form["email"],
            "gender" : request.form["gender"],
            "dob" : request.form["dob"],
            "phone" : request.form["phone"],
            "bio" : request.form["bio"],
            "height" : request.form["height"],
            "latitude" : 0,
            "longitude" : 0,
            "potenial_matches" : [],
            "liked_users" : [],
            "matches" : []
            
        }
        new_user_id = users_collection.insert_one(new_user)
        new_user_link = "http://localhost:5000/user/" + str(new_user_id.inserted_id)
        return make_response( jsonify(
             {"url": new_user_link} ), 201)
    else:
        missing_fields = [field for field in required_fields if field not in request.form]
        return make_response( jsonify(
             {"error":"Missing form data: {}".format(", ".join(missing_fields))} ), 400)

#delete user
@app.route("/user/<string:id>",methods=["DELETE"])
def delete_user(id):
    #check if id is 24 characters longs and that all characters are in hexadecimal
    if len(id) != 24 or not all(c in string.hexdigits for c in id):
        #displays errors if criteria not met
        return make_response( jsonify({"error" : "Invalid user ID"} ), 404 )
    
    #tries to delete the user
    result = users_collection.delete_one( { "_id" : ObjectId(id) } )
    
    
    if result.deleted_count == 1:
        return make_response( jsonify( {} ), 204)
    else:
        return make_response( jsonify({ "error" : "Invalid user ID" } ), 404)

#add a potential match
@app.route("/user/<string:id>/potential_matches", methods=["POST"])
def add_potential_matches(id):
    # checks to see if entered id is valid
    user = users_collection.find_one({'_id': ObjectId(id)})
    if user is None:
        # returns error if id is invalid
        return make_response(jsonify({"error": "Invalid user ID"}), 404)

    # creating objects
    user_id = request.form["user_id"]
    message = request.form["message"]

    # check if user_id is already in the user's potential_matches list
    potential_matches = user.get("potential_matches", [])
    for potential_match in potential_matches:
        if potential_match.get("user_id") == user_id:
            # add each other's id to a new array called "matches"
            new_match = {
                "_id": ObjectId(),
                "user_id": user_id,
                "message": message
            }
            users_collection.update_one(
                {"_id": ObjectId(id)},
                {"$push": {"matches": user_id}}
            )
            users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$push": {"matches": id}}
            )
            # return success message with the new match URL
            new_match_link = "http://localhost:5000/users/" + id + "/matches/" + str(new_match['_id'])
            return make_response(jsonify({"message": "New match added", "url": new_match_link}), 201)

    # create new potential_match object and like object
    new_potential_match = {
        "_id": ObjectId(),
        "user_id": user_id,
        "message": message
    }
    new_like = {
        "_id": ObjectId(),
        "user_id": id,
        "message": message
    }

    # push the data
    users_collection.update_one(
        {"_id": ObjectId(id)},
        {"$push": {"potential_matches": new_potential_match}}
    )
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"likes": new_like}}
    )

    # return success message with the new potential_match URL
    new_potential_match_link = "http://localhost:5000/users/" + id + "/potential_matches/" + str(new_potential_match['_id'])
    return make_response(jsonify({"message": "New potential match added", "url": new_potential_match_link}), 201)

@app.route("/message", methods=["POST"])
def send_message():
    #checks to see if the user id is valid
    user_id = request.args.get("user_id")
    id = request.args.get("id")
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if user is None:
        #returns error is id is invalid
        return make_response(jsonify({"error": "Invalid user ID"}), 404)
    
    required_fields = ["message", "timestamp"]
    
    if all(field in request.args for field in required_fields):
        #creates the message object 
        new_message = {
            "_id" : ObjectId(),
            "sender_id" : request.args.get("id"),
            "recipient_id" : request.args.get("user_id"),
            "message" : request.args.get("message"),
            "timestamp" : request.args.get("timestamp")
              
        }
        #inserts the message into the table
        new_message_id = messages_collection.insert_one(new_message)
        new_message_link = "http://localhost:5000/user/" + str(new_message_id.inserted_id) + "/message"
        return make_response( jsonify(
             {"url": new_message_link} ), 201)
    else:
        missing_fields = [field for field in required_fields if field not in request.args]
        return make_response( jsonify(
             {"error":"Missing form data: {}".format(", ".join(missing_fields))} ), 400)
#get all messages with a user
@app.route('/messages', methods=['GET'])
def get_messages_with_user():
    
    required_fields = ["id", "user_id"]
    if not all(field in request.args for field in required_fields):
        return jsonify({'message': 'Missing fields'}), 400

    id = request.args['id']
    user_id = request.args['user_id']

    all_messages = messages_collection.find({
        "$or": [
            {"sender_id": id, "recipient_id": user_id},
            {"recipient_id": id, "sender_id": user_id},
        ]
    })

    message_list = []
    for msg in all_messages:
        # Convert ObjectId fields to strings
        msg['_id'] = str(msg['_id'])
        msg['sender_id'] = str(msg['sender_id'])
        msg['recipient_id'] = str(msg['recipient_id'])
        msg['timestamp'] = str(msg['timestamp'])
        msg['message'] = str(msg['message'])
        message_list.append(msg)

    return jsonify(message_list)
#get latest message with a user 
@app.route('/messageslatest', methods=['GET'])
def get_latest_message_with_user():
    required_fields = ["id", "user_id"]
    if not all(field in request.args for field in required_fields):
        return jsonify({'message': 'Missing fields'}), 400

    id = request.args['id']
    user_id = request.args['user_id']

    latest_message_count = messages_collection.count_documents({
        "$or": [
            {"sender_id": id, "recipient_id": user_id},
            {"recipient_id": id, "sender_id": user_id},
        ]
    })

    if latest_message_count == 0:
        return jsonify({'message': 'No result'})

    latest_message = messages_collection.find({
        "$or": [
            {"sender_id": id, "recipient_id": user_id},
            {"recipient_id": id, "sender_id": user_id},
        ]
    }).sort([("timestamp", -1)]).limit(1)

    # Convert ObjectId fields to strings
    latest_message = latest_message[0]
    latest_message['_id'] = str(latest_message['_id'])
    latest_message['sender_id'] = str(latest_message['sender_id'])
    latest_message['recipient_id'] = str(latest_message['recipient_id'])
    latest_message['timestamp'] = str(latest_message['timestamp'])
    latest_message['message'] = str(latest_message['message'])

    return jsonify({
        'sender_id': latest_message['sender_id'],
        'message': latest_message['message'],
        'timestamp': latest_message['timestamp']
    })

#get all your matches
@app.route("/matches/<string:id>", methods=["GET"])
def get_matches(id):
    # Check if entered id is valid
    user = users_collection.find_one({'_id': ObjectId(id)})
    if user is None:
        # Return error if id is invalid
        return make_response(jsonify({"error": "Invalid user ID"}), 404)
    
    # Retrieve the matches array for the user
    matches = user.get('matches', [])
    
    # Return the matches array
    return make_response(jsonify(matches), 200)
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    # check if username and password are valid
    user = users_collection.find_one({'email': email})
    if user and user['password'] == password:
        # check if user is already online
        if user['online'] == 1:
            return jsonify({'error': 'User is already logged in.'})
        
        # log user in by creating a session
        session['user_id'] = str(user['_id']) # store user id in session 
        
        # set online status to 1
        users_collection.update_one({'_id': user['_id']}, {'$set': {'online': 1}})
        
        # return user ID
        return jsonify({'userId': str(user['_id'])})

    # return error message if login fails
    return jsonify({'error': 'Invalid email or password.'})

#logout
@app.route('/logout', methods=['POST'])
def logout():
    user_id = request.form.get('user_id')

    # check if user exists
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'error': 'User not found.'})

    # update online status to 0
    users_collection.update_one({'_id': ObjectId(user_id)}, {'$set': {'online': 0}}) 
    return jsonify({'message': 'goodbye'})


@app.route('/photos', methods=['GET'])
def get_all_photos():
    photos = []
    for photo in photos_collection.find():
        photo['_id'] = str(photo['_id'])  # Convert ObjectId to string for JSON serialization
        photos.append(photo)
    return jsonify({'photos': photos})

@app.route('/photos', methods=['POST'])
def save_photo():
    # get the photo from the request
    photo = request.get_json()

    # save the photo to the collection
    result = db.photos.insert_one(photo)

    # return the result of the insertion
    return jsonify({'message': 'Photo saved successfully', 'id': str(result.inserted_id)})

# application functionality
if __name__ == "__main__":
    app.run(debug=True)