from flask import Blueprint, jsonify

hello_bp = Blueprint('helloworld', __name__)

@hello_bp.route('/helloworld', methods=['GET'])
def helloworld():
    return jsonify({"message": "Hello World"})