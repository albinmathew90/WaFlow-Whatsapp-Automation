import { useState, useMemo } from 'react';
import { Application } from '../../Applications';
import CopyButton from '../../../../components/common/CopyButton';

type Endpoint = 'send' | 'verify' | 'resend' | 'status';
type Language = 'cURL' | 'Node.js' | 'Python' | 'PHP' | 'Go' | 'Java' | 'C#' | 'Ruby' | 'Swift' | 'Rust';

export default function SdkSnippetsTab({ app }: { app: Application }) {
  const [activeEndpoint, setActiveEndpoint] = useState<Endpoint>('send');
  const [activeLang, setActiveLang] = useState<Language>('Node.js');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSnippet = (endpoint: Endpoint, lang: Language) => {
    const snippets: Record<Endpoint, Record<Language, string>> = {
      send: {
        'cURL': `curl -X POST https://waflow.devicedoctorindia.com/api/otp/send \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_SECRET_KEY" \\
  -d '{
    "applicationId": "${app.applicationId}",
    "phone": "+1234567890"
  }'`,
        'Node.js': `const fetch = require('node-fetch');

async function sendOtp() {
  const response = await fetch('https://waflow.devicedoctorindia.com/api/otp/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YOUR_SECRET_KEY'
    },
    body: JSON.stringify({ 
      applicationId: '${app.applicationId}',
      phone: '+1234567890' 
    })
  });

  const data = await response.json();
  console.log(data);
}

sendOtp();`,
        'Python': `import requests

url = "https://waflow.devicedoctorindia.com/api/otp/send"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "YOUR_SECRET_KEY"
}
payload = {
    "applicationId": "${app.applicationId}",
    "phone": "+1234567890"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
        'PHP': `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://waflow.devicedoctorindia.com/api/otp/send");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);

$payload = json_encode([
    'applicationId' => '${app.applicationId}',
    'phone' => '+1234567890'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

$headers = [
    "Content-Type: application/json",
    "x-api-key: YOUR_SECRET_KEY"
];
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$result = curl_exec($ch);
curl_close($ch);

echo $result;
?>`,
        'Go': `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	url := "https://waflow.devicedoctorindia.com/api/otp/send"
	
	payload := map[string]string{
		"applicationId": "${app.applicationId}",
		"phone":         "+1234567890",
	}
	jsonValue, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", "YOUR_SECRET_KEY")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	fmt.Println(resp.Status)
}`,
        'Java': `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        String jsonPayload = "{" +
            "\\"applicationId\\": \\"${app.applicationId}\\"," +
            "\\"phone\\": \\"+1234567890\\"" +
        "}";

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://waflow.devicedoctorindia.com/api/otp/send"))
            .header("Content-Type", "application/json")
            .header("x-api-key", "YOUR_SECRET_KEY")
            .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
            .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`,
        'C#': `using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        var client = new HttpClient();
        var json = @"{ ""applicationId"": ""${app.applicationId}"", ""phone"": ""+1234567890"" }";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var request = new HttpRequestMessage(HttpMethod.Post, "https://waflow.devicedoctorindia.com/api/otp/send");
        request.Headers.Add("x-api-key", "YOUR_SECRET_KEY");
        request.Content = content;

        var response = await client.SendAsync(request);
        Console.WriteLine(await response.Content.ReadAsStringAsync());
    }
}`,
        'Ruby': `require 'uri'
require 'net/http'
require 'json'

url = URI("https://waflow.devicedoctorindia.com/api/otp/send")
http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Content-Type"] = "application/json"
request["x-api-key"] = "YOUR_SECRET_KEY"
request.body = JSON.dump({
  "applicationId" => "${app.applicationId}",
  "phone" => "+1234567890"
})

response = http.request(request)
puts response.read_body`,
        'Swift': `import Foundation

let url = URL(string: "https://waflow.devicedoctorindia.com/api/otp/send")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.setValue("YOUR_SECRET_KEY", forHTTPHeaderField: "x-api-key")

let parameters: [String: Any] = [
    "applicationId": "${app.applicationId}",
    "phone": "+1234567890"
]
request.httpBody = try? JSONSerialization.data(withJSONObject: parameters)

let task = URLSession.shared.dataTask(with: request) { data, response, error in
    if let data = data {
        print(String(data: data, encoding: .utf8)!)
    }
}
task.resume()`,
        'Rust': `use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let res = client.post("https://waflow.devicedoctorindia.com/api/otp/send")
        .header("Content-Type", "application/json")
        .header("x-api-key", "YOUR_SECRET_KEY")
        .json(&json!({
            "applicationId": "${app.applicationId}",
            "phone": "+1234567890"
        }))
        .send()
        .await?;

    println!("{:?}", res.text().await?);
    Ok(())
}`
      },
      verify: {
        'cURL': `curl -X POST https://waflow.devicedoctorindia.com/api/otp/verify \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_SECRET_KEY" \\
  -d '{
    "applicationId": "${app.applicationId}",
    "phone": "+1234567890",
    "requestId": "req_abc123",
    "otp": "123456"
  }'`,
        'Node.js': `const fetch = require('node-fetch');

async function verifyOtp() {
  const response = await fetch('https://waflow.devicedoctorindia.com/api/otp/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YOUR_SECRET_KEY'
    },
    body: JSON.stringify({ 
      applicationId: '${app.applicationId}',
      phone: '+1234567890',
      requestId: 'req_abc123',
      otp: '123456'
    })
  });

  const data = await response.json();
  console.log(data);
}

verifyOtp();`,
        'Python': `import requests

url = "https://waflow.devicedoctorindia.com/api/otp/verify"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "YOUR_SECRET_KEY"
}
payload = {
    "applicationId": "${app.applicationId}",
    "phone": "+1234567890",
    "requestId": "req_abc123",
    "otp": "123456"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
        'PHP': `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://waflow.devicedoctorindia.com/api/otp/verify");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);

$payload = json_encode([
    'applicationId' => '${app.applicationId}',
    'phone' => '+1234567890',
    'requestId' => 'req_abc123',
    'otp' => '123456'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json", "x-api-key: YOUR_SECRET_KEY"]);

$result = curl_exec($ch);
curl_close($ch);
echo $result;
?>`,
        'Go': `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	url := "https://waflow.devicedoctorindia.com/api/otp/verify"
	payload := map[string]string{
		"applicationId": "${app.applicationId}",
		"phone":         "+1234567890",
    "requestId":     "req_abc123",
    "otp":           "123456",
	}
	jsonValue, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", "YOUR_SECRET_KEY")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println(resp.Status)
}`,
        'Java': `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        String jsonPayload = "{" +
            "\\"applicationId\\": \\"${app.applicationId}\\"," +
            "\\"phone\\": \\"+1234567890\\"," +
            "\\"requestId\\": \\"req_abc123\\"," +
            "\\"otp\\": \\"123456\\"" +
        "}";

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://waflow.devicedoctorindia.com/api/otp/verify"))
            .header("Content-Type", "application/json")
            .header("x-api-key", "YOUR_SECRET_KEY")
            .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
            .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`,
        'C#': `using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        var client = new HttpClient();
        var json = @"{ ""applicationId"": ""${app.applicationId}"", ""phone"": ""+1234567890"", ""requestId"": ""req_abc123"", ""otp"": ""123456"" }";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var request = new HttpRequestMessage(HttpMethod.Post, "https://waflow.devicedoctorindia.com/api/otp/verify");
        request.Headers.Add("x-api-key", "YOUR_SECRET_KEY");
        request.Content = content;

        var response = await client.SendAsync(request);
        Console.WriteLine(await response.Content.ReadAsStringAsync());
    }
}`,
        'Ruby': `require 'uri'
require 'net/http'
require 'json'

url = URI("https://waflow.devicedoctorindia.com/api/otp/verify")
http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Content-Type"] = "application/json"
request["x-api-key"] = "YOUR_SECRET_KEY"
request.body = JSON.dump({
  "applicationId" => "${app.applicationId}",
  "phone" => "+1234567890",
  "requestId" => "req_abc123",
  "otp" => "123456"
})

response = http.request(request)
puts response.read_body`,
        'Swift': `import Foundation

let url = URL(string: "https://waflow.devicedoctorindia.com/api/otp/verify")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.setValue("YOUR_SECRET_KEY", forHTTPHeaderField: "x-api-key")

let parameters: [String: Any] = [
    "applicationId": "${app.applicationId}",
    "phone": "+1234567890",
    "requestId": "req_abc123",
    "otp": "123456"
]
request.httpBody = try? JSONSerialization.data(withJSONObject: parameters)

let task = URLSession.shared.dataTask(with: request) { data, response, error in
    if let data = data { print(String(data: data, encoding: .utf8)!) }
}
task.resume()`,
        'Rust': `use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let res = client.post("https://waflow.devicedoctorindia.com/api/otp/verify")
        .header("Content-Type", "application/json")
        .header("x-api-key", "YOUR_SECRET_KEY")
        .json(&json!({
            "applicationId": "${app.applicationId}",
            "phone": "+1234567890",
            "requestId": "req_abc123",
            "otp": "123456"
        }))
        .send()
        .await?;

    println!("{:?}", res.text().await?);
    Ok(())
}`
      },
      resend: {
        'cURL': `curl -X POST https://waflow.devicedoctorindia.com/api/otp/resend \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_SECRET_KEY" \\
  -d '{
    "applicationId": "${app.applicationId}",
    "phone": "+1234567890",
    "previousRequestId": "req_abc123"
  }'`,
        'Node.js': `const fetch = require('node-fetch');

async function resendOtp() {
  const response = await fetch('https://waflow.devicedoctorindia.com/api/otp/resend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YOUR_SECRET_KEY'
    },
    body: JSON.stringify({ 
      applicationId: '${app.applicationId}',
      phone: '+1234567890',
      previousRequestId: 'req_abc123'
    })
  });
  console.log(await response.json());
}
resendOtp();`,
        'Python': `import requests

response = requests.post(
    "https://waflow.devicedoctorindia.com/api/otp/resend",
    headers={"Content-Type": "application/json", "x-api-key": "YOUR_SECRET_KEY"},
    json={
        "applicationId": "${app.applicationId}",
        "phone": "+1234567890",
        "previousRequestId": "req_abc123"
    }
)
print(response.json())`,
        'PHP': `<?php
$ch = curl_init("https://waflow.devicedoctorindia.com/api/otp/resend");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'applicationId' => '${app.applicationId}',
    'phone' => '+1234567890',
    'previousRequestId' => 'req_abc123'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json", "x-api-key: YOUR_SECRET_KEY"]);
echo curl_exec($ch);
curl_close($ch);
?>`,
        'Go': `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]string{
		"applicationId": "${app.applicationId}",
		"phone":         "+1234567890",
    "previousRequestId": "req_abc123",
	}
	jsonValue, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://waflow.devicedoctorindia.com/api/otp/resend", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", "YOUR_SECRET_KEY")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println(resp.Status)
}`,
        'Java': `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        String jsonPayload = "{" +
            "\\"applicationId\\": \\"${app.applicationId}\\"," +
            "\\"phone\\": \\"+1234567890\\"," +
            "\\"previousRequestId\\": \\"req_abc123\\"" +
        "}";

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://waflow.devicedoctorindia.com/api/otp/resend"))
            .header("Content-Type", "application/json")
            .header("x-api-key", "YOUR_SECRET_KEY")
            .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
            .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`,
        'C#': `using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        var client = new HttpClient();
        var json = @"{ ""applicationId"": ""${app.applicationId}"", ""phone"": ""+1234567890"", ""previousRequestId"": ""req_abc123"" }";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var request = new HttpRequestMessage(HttpMethod.Post, "https://waflow.devicedoctorindia.com/api/otp/resend");
        request.Headers.Add("x-api-key", "YOUR_SECRET_KEY");
        request.Content = content;

        var response = await client.SendAsync(request);
        Console.WriteLine(await response.Content.ReadAsStringAsync());
    }
}`,
        'Ruby': `require 'uri'
require 'net/http'
require 'json'

url = URI("https://waflow.devicedoctorindia.com/api/otp/resend")
http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Content-Type"] = "application/json"
request["x-api-key"] = "YOUR_SECRET_KEY"
request.body = JSON.dump({
  "applicationId" => "${app.applicationId}",
  "phone" => "+1234567890",
  "previousRequestId" => "req_abc123"
})

response = http.request(request)
puts response.read_body`,
        'Swift': `import Foundation

let url = URL(string: "https://waflow.devicedoctorindia.com/api/otp/resend")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.setValue("YOUR_SECRET_KEY", forHTTPHeaderField: "x-api-key")

let parameters: [String: Any] = [
    "applicationId": "${app.applicationId}",
    "phone": "+1234567890",
    "previousRequestId": "req_abc123"
]
request.httpBody = try? JSONSerialization.data(withJSONObject: parameters)

let task = URLSession.shared.dataTask(with: request) { data, response, error in
    if let data = data { print(String(data: data, encoding: .utf8)!) }
}
task.resume()`,
        'Rust': `use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let res = client.post("https://waflow.devicedoctorindia.com/api/otp/resend")
        .header("Content-Type", "application/json")
        .header("x-api-key", "YOUR_SECRET_KEY")
        .json(&json!({
            "applicationId": "${app.applicationId}",
            "phone": "+1234567890",
            "previousRequestId": "req_abc123"
        }))
        .send()
        .await?;

    println!("{:?}", res.text().await?);
    Ok(())
}`
      },
      status: {
        'cURL': `curl -X GET https://waflow.devicedoctorindia.com/api/otp/status/req_abc123 \\
  -H "x-api-key: YOUR_SECRET_KEY" \\
  -H "x-application-id: ${app.applicationId}"`,
        'Node.js': `const fetch = require('node-fetch');

async function getStatus() {
  const response = await fetch('https://waflow.devicedoctorindia.com/api/otp/status/req_abc123', {
    method: 'GET',
    headers: {
      'x-api-key': 'YOUR_SECRET_KEY',
      'x-application-id': '${app.applicationId}'
    }
  });
  console.log(await response.json());
}
getStatus();`,
        'Python': `import requests

response = requests.get(
    "https://waflow.devicedoctorindia.com/api/otp/status/req_abc123",
    headers={
        "x-api-key": "YOUR_SECRET_KEY",
        "x-application-id": "${app.applicationId}"
    }
)
print(response.json())`,
        'PHP': `<?php
$ch = curl_init("https://waflow.devicedoctorindia.com/api/otp/status/req_abc123");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "x-api-key: YOUR_SECRET_KEY",
    "x-application-id: ${app.applicationId}"
]);
echo curl_exec($ch);
curl_close($ch);
?>`,
        'Go': `package main

import (
	"fmt"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://waflow.devicedoctorindia.com/api/otp/status/req_abc123", nil)
	req.Header.Set("x-api-key", "YOUR_SECRET_KEY")
  req.Header.Set("x-application-id", "${app.applicationId}")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println(resp.Status)
}`,
        'Java': `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://waflow.devicedoctorindia.com/api/otp/status/req_abc123"))
            .header("x-api-key", "YOUR_SECRET_KEY")
            .header("x-application-id", "${app.applicationId}")
            .GET()
            .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`,
        'C#': `using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        var client = new HttpClient();
        var request = new HttpRequestMessage(HttpMethod.Get, "https://waflow.devicedoctorindia.com/api/otp/status/req_abc123");
        request.Headers.Add("x-api-key", "YOUR_SECRET_KEY");
        request.Headers.Add("x-application-id", "${app.applicationId}");

        var response = await client.SendAsync(request);
        Console.WriteLine(await response.Content.ReadAsStringAsync());
    }
}`,
        'Ruby': `require 'uri'
require 'net/http'

url = URI("https://waflow.devicedoctorindia.com/api/otp/status/req_abc123")
http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)
request["x-api-key"] = "YOUR_SECRET_KEY"
request["x-application-id"] = "${app.applicationId}"

response = http.request(request)
puts response.read_body`,
        'Swift': `import Foundation

let url = URL(string: "https://waflow.devicedoctorindia.com/api/otp/status/req_abc123")!
var request = URLRequest(url: url)
request.httpMethod = "GET"
request.setValue("YOUR_SECRET_KEY", forHTTPHeaderField: "x-api-key")
request.setValue("${app.applicationId}", forHTTPHeaderField: "x-application-id")

let task = URLSession.shared.dataTask(with: request) { data, response, error in
    if let data = data { print(String(data: data, encoding: .utf8)!) }
}
task.resume()`,
        'Rust': `use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let res = client.get("https://waflow.devicedoctorindia.com/api/otp/status/req_abc123")
        .header("x-api-key", "YOUR_SECRET_KEY")
        .header("x-application-id", "${app.applicationId}")
        .send()
        .await?;

    println!("{:?}", res.text().await?);
    Ok(())
}`
      }
    };
    return snippets[endpoint][lang];
  };

  const languages: Language[] = ['cURL', 'Node.js', 'Python', 'PHP', 'Go', 'Java', 'C#', 'Ruby', 'Swift', 'Rust'];
  const endpoints: { value: Endpoint, label: string }[] = [
    { value: 'send', label: 'POST /otp/send' },
    { value: 'verify', label: 'POST /otp/verify' },
    { value: 'resend', label: 'POST /otp/resend' },
    { value: 'status', label: 'GET /otp/status/{requestId}' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">SDK Snippets</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Implementation code snippets in multiple languages for integrating the OTP API.
          </p>
        </div>
        
        {/* Endpoint Selector */}
        <div className="w-64">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Select Endpoint
          </label>
          <div className="relative">
            <select 
              value={activeEndpoint}
              onChange={(e) => setActiveEndpoint(e.target.value as Endpoint)}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {endpoints.map(ep => (
                <option key={ep.value} value={ep.value}>{ep.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar: Vertical Language List */}
        <div className="w-full md:w-56 flex-shrink-0">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Programming Language</h3>
          <nav className="flex flex-col gap-1.5">
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => setActiveLang(l)}
                className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between border ${
                  activeLang === l 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 shadow-sm' 
                    : 'bg-transparent border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 hover:border-gray-200 dark:hover:bg-gray-800 dark:hover:border-gray-700'
                }`}
              >
                {l}
                {activeLang === l && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Main Area: Code Editor */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#121212] rounded-xl overflow-hidden shadow-xl border border-gray-800 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center bg-[#1e1e1e] border-b border-[#333] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/90"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/90"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/90"></div>
                </div>
                <span className="text-sm font-mono text-gray-400 border-l border-gray-700 pl-3 ml-1">
                  {activeLang} Implementation
                </span>
              </div>
              <CopyButton 
                textToCopy={getSnippet(activeEndpoint, activeLang)}
                className="text-xs font-medium text-gray-300 hover:text-white transition flex items-center justify-center gap-2 bg-[#2d2d2d] hover:bg-[#404040] px-3 py-1.5 rounded-lg border border-[#444] w-28"
                defaultText={
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Code
                  </>
                }
                copiedText={
                  <>
                    <svg className="w-4 h-4 text-[#4ec9b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[#4ec9b0]">Copied!</span>
                  </>
                }
              />
            </div>
            
            <div className="p-6 overflow-x-auto custom-scrollbar flex-1">
              <pre className="text-[14px] font-mono text-[#e5e7eb] leading-relaxed">
                <code>{getSnippet(activeEndpoint, activeLang)}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
