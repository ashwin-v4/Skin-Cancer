from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cpu")

class MultimodalModel(nn.Module):
    def __init__(self, num_metadata_features, pretrained=False):
        super().__init__()
        
        self.cnn = models.resnet18(pretrained=pretrained)
        self.cnn.fc = nn.Identity()
        img_features = 512
        
        self.metadata_fc = nn.Sequential(
            nn.Linear(num_metadata_features, 32),
            nn.ReLU(),
            nn.BatchNorm1d(32)
        )
        
        self.classifier = nn.Sequential(
            nn.Linear(img_features + 32, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 1)
        )
    
    def forward(self, image, metadata=None):
        img_out = self.cnn(image)
        if metadata is not None:
            meta_out = self.metadata_fc(metadata)
            combined = torch.cat([img_out, meta_out], dim=1)
        else:
            combined = img_out
        return self.classifier(combined)

model = MultimodalModel(num_metadata_features=17, pretrained=False)
model.load_state_dict(torch.load("models/best_multimodal_model.pth", map_location=device))
model.to(device)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
])

METADATA_FIELDS = [
    'smoke', 'drink', 'background_father', 'background_mother', 
    'age', 'gender', 'skin_cancer_history', 'cancer_history', 
    'region', 'itch', 'grew', 'hurt', 'changed', 'bleed', 
    'elevation', 'biopsed', 'fitzpatrick'
]

def preprocess_metadata(metadata_json):
    metadata_dict = json.loads(metadata_json)
    metadata_values = [float(metadata_dict.get(field, -1)) for field in METADATA_FIELDS]
    return torch.tensor([metadata_values], dtype=torch.float32).to(device)

def preprocess_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_tensor = transform(image).unsqueeze(0).to(device)
    return image_tensor

@app.get("/")
def root():
    return {"message": "Skin Cancer Classification API", "status": "running"}

@app.post("/predict")
async def predict(
    image: UploadFile = File(...),
    metadata: str = Form(...)
):
    try:
        image_bytes = await image.read()
        
        image_tensor = preprocess_image(image_bytes)
        metadata_tensor = preprocess_metadata(metadata)
        
        with torch.no_grad():
            output = model(image_tensor, metadata_tensor)
            probability = torch.sigmoid(output).item()
            prediction = 1 if probability > 0.5 else 0
        
        label_mapping = {0: "Benign", 1: "Malignant"}
        predicted_label = label_mapping[prediction]
        
        confidence_level = "high" if probability > 0.7 or probability < 0.3 else "medium"
        
        return {
            "success": True,
            "prediction": predicted_label,
            "probability": round(probability, 4),
            "confidence_level": confidence_level
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)