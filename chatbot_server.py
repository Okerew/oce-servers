from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoModelForCausalLM, AutoTokenizer, StoppingCriteria, StoppingCriteriaList
import torch

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

model_name = "gpt2-medium"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.float16)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

MAX_LENGTH = 512
TEMPERATURE = 0.5
TOP_P = 0.9
TOP_K = 50

class EndOfTextCriteria(StoppingCriteria):
    def __init__(self, end_tokens, tokenizer):
        self.end_tokens = end_tokens
        self.tokenizer = tokenizer

    def __call__(self, input_ids, scores, **kwargs):
        last_tokens = input_ids[0][-10:].tolist()
        last_text = self.tokenizer.decode(last_tokens)
        return any(end_token in last_text for end_token in self.end_tokens)

conversation_history = []

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({"error": "No message provided"}), 400

        user_message = data.get("message", "")
        conversation_history.append(f"User: {user_message}")

        prompt = "\n".join(conversation_history) + "\nChatbot:"

        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=MAX_LENGTH)
        inputs = {k: v.to(device) for k, v in inputs.items()}

        end_tokens = ["\n\n", ".", "!", "?"]
        stopping_criteria = StoppingCriteriaList([EndOfTextCriteria(end_tokens, tokenizer)])

        with torch.no_grad():
            outputs = model.generate(
                input_ids=inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                max_length=MAX_LENGTH,
                temperature=TEMPERATURE,
                do_sample=True,
                top_p=TOP_P,
                top_k=TOP_K,
                no_repeat_ngram_size=3,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                stopping_criteria=stopping_criteria
            )

        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        if not generated_text:
            return jsonify({"error": "No response generated"}), 500

        response_start = generated_text.rfind("Chatbot:")
        chatbot_response = generated_text[response_start + len("Chatbot:"):].strip()

        conversation_history.append(f"Chatbot: {chatbot_response}")

        return jsonify({"response": chatbot_response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
