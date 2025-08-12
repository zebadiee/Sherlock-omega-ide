/**
 * Serverless Telemetry Ingestion Handler
 * Collects and processes Sherlock Ω telemetry data
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cloudwatch = new AWS.CloudWatch();
const sns = new AWS.SNS();

const TELEMETRY_TABLE = process.env.TELEMETRY_TABLE || 'sherlock-omega-telemetry';
const METRICS_NAMESPACE = 'SherlockOmega/Telemetry';
const ALERT_TOPIC_ARN = process.env.ALERT_TOPIC_ARN;

exports.handler = async (event, context) => {
  console.log('📊 Processing telemetry data:', JSON.stringify(event, null, 2));

  try {
    // Parse the incoming request
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { events, metadata } = body;

    if (!events || !Array.isArray(events)) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: 'Invalid events data' })
      };
    }

    // Process each telemetry event
    const processedEvents = [];
    const metrics = [];
    const alerts = [];

    for (const telemetryEvent of events) {
      try {
        // Validate event structure
        if (!isValidTelemetryEvent(telemetryEvent)) {
          console.warn('Invalid telemetry event:', telemetryEvent);
          continue;
        }

        // Store event in DynamoDB
        await storeEvent(telemetryEvent);
        processedEvents.push(telemetryEvent);

        // Extract metrics for CloudWatch
        const eventMetrics = extractMetrics(telemetryEvent);
        metrics.push(...eventMetrics);

        // Check for alert conditions
        const eventAlerts = checkAlertConditions(telemetryEvent);
        alerts.push(...eventAlerts);

      } catch (error) {
        console.error('Error processing event:', error, telemetryEvent);
      }
    }

    // Send metrics to CloudWatch
    if (metrics.length > 0) {
      await sendMetricsToCloudWatch(metrics);
    }

    // Send alerts if any
    if (alerts.length > 0) {
      await sendAlerts(alerts);
    }

    // Generate response
    const response = {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        success: true,
        processed: processedEvents.length,
        metrics: metrics.length,
        alerts: alerts.length,
        timestamp: Date.now()
      })
    };

    console.log(`✅ Successfully processed ${processedEvents.length} events`);
    return response;

  } catch (error) {
    console.error('❌ Error processing telemetry:', error);
    
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * Validate telemetry event structure
 */
function isValidTelemetryEvent(event) {
  return event &&
    typeof event.id === 'string' &&
    typeof event.type === 'string' &&
    typeof event.timestamp === 'number' &&
    typeof event.sessionId === 'string' &&
    event.data &&
    event.metadata;
}

/**
 * Store event in DynamoDB
 */
async function storeEvent(event) {
  const item = {
    id: event.id,
    sessionId: event.sessionId,
    type: event.type,
    timestamp: event.timestamp,
    userId: event.userId || 'anonymous',
    data: event.data,
    metadata: event.metadata,
    ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days TTL
    createdAt: new Date().toISOString()
  };

  await dynamodb.put({
    TableName: TELEMETRY_TABLE,
    Item: item
  }).promise();
}

/**
 * Extract CloudWatch metrics from telemetry event
 */
function extractMetrics(event) {
  const metrics = [];
  const timestamp = new Date(event.timestamp);

  // Base metrics for all events
  metrics.push({
    MetricName: 'EventCount',
    Value: 1,
    Unit: 'Count',
    Timestamp: timestamp,
    Dimensions: [
      { Name: 'EventType', Value: event.type },
      { Name: 'Environment', Value: event.metadata.environment || 'unknown' },
      { Name: 'Platform', Value: event.metadata.platform || 'unknown' }
    ]
  });

  // Event-specific metrics
  switch (event.type) {
    case 'friction_detected':
      metrics.push({
        MetricName: 'FrictionDetected',
        Value: 1,
        Unit: 'Count',
        Timestamp: timestamp,
        Dimensions: [
          { Name: 'FrictionType', Value: event.data.frictionType || 'unknown' },
          { Name: 'Severity', Value: event.data.severity || 'unknown' }
        ]
      });
      break;

    case 'friction_eliminated':
      metrics.push({
        MetricName: 'FrictionEliminated',
        Value: 1,
        Unit: 'Count',
        Timestamp: timestamp,
        Dimensions: [
          { Name: 'FrictionType', Value: event.data.frictionType || 'unknown' }
        ]
      });

      if (event.data.eliminationTime) {
        metrics.push({
          MetricName: 'EliminationTime',
          Value: event.data.eliminationTime,
          Unit: 'Milliseconds',
          Timestamp: timestamp,
          Dimensions: [
            { Name: 'FrictionType', Value: event.data.frictionType || 'unknown' }
          ]
        });
      }
      break;

    case 'response_time':
      if (event.data.value) {
        metrics.push({
          MetricName: 'ResponseTime',
          Value: event.data.value,
          Unit: event.data.unit === 'ms' ? 'Milliseconds' : 'Count',
          Timestamp: timestamp,
          Dimensions: [
            { Name: 'Metric', Value: event.data.metric || 'unknown' }
          ]
        });
      }
      break;

    case 'productivity_boost':
      if (event.data.timeSaved) {
        metrics.push({
          MetricName: 'TimeSaved',
          Value: event.data.timeSaved,
          Unit: 'Milliseconds',
          Timestamp: timestamp,
          Dimensions: [
            { Name: 'FrictionType', Value: event.data.frictionType || 'unknown' },
            { Name: 'Impact', Value: event.data.impact || 'unknown' }
          ]
        });
      }
      break;

    case 'flow_state_entered':
    case 'flow_state_broken':
      metrics.push({
        MetricName: 'FlowStateChange',
        Value: event.type === 'flow_state_entered' ? 1 : -1,
        Unit: 'Count',
        Timestamp: timestamp,
        Dimensions: [
          { Name: 'FlowState', Value: event.type === 'flow_state_entered' ? 'entered' : 'broken' }
        ]
      });
      break;

    case 'user_satisfaction':
      if (event.data.rating) {
        metrics.push({
          MetricName: 'UserSatisfaction',
          Value: event.data.rating,
          Unit: 'None',
          Timestamp: timestamp
        });
      }
      break;
  }

  return metrics;
}

/**
 * Check for alert conditions
 */
function checkAlertConditions(event) {
  const alerts = [];

  // High friction detection rate
  if (event.type === 'friction_detected' && event.data.severity === 'high') {
    alerts.push({
      type: 'high_friction',
      message: `High severity friction detected: ${event.data.frictionType}`,
      event: event
    });
  }

  // Slow response times
  if (event.type === 'response_time' && event.data.value > 1000) {
    alerts.push({
      type: 'slow_response',
      message: `Slow response time detected: ${event.data.value}ms`,
      event: event
    });
  }

  // Low user satisfaction
  if (event.type === 'user_satisfaction' && event.data.rating < 3) {
    alerts.push({
      type: 'low_satisfaction',
      message: `Low user satisfaction: ${event.data.rating}/5`,
      event: event
    });
  }

  // Frequent flow state breaks
  if (event.type === 'flow_state_broken') {
    alerts.push({
      type: 'flow_state_broken',
      message: 'Flow state broken - potential friction issue',
      event: event
    });
  }

  return alerts;
}

/**
 * Send metrics to CloudWatch
 */
async function sendMetricsToCloudWatch(metrics) {
  // CloudWatch has a limit of 20 metrics per request
  const chunks = chunkArray(metrics, 20);

  for (const chunk of chunks) {
    await cloudwatch.putMetricData({
      Namespace: METRICS_NAMESPACE,
      MetricData: chunk
    }).promise();
  }

  console.log(`📈 Sent ${metrics.length} metrics to CloudWatch`);
}

/**
 * Send alerts via SNS
 */
async function sendAlerts(alerts) {
  if (!ALERT_TOPIC_ARN) {
    console.log('No alert topic configured, skipping alerts');
    return;
  }

  for (const alert of alerts) {
    const message = {
      alertType: alert.type,
      message: alert.message,
      timestamp: new Date().toISOString(),
      event: alert.event
    };

    await sns.publish({
      TopicArn: ALERT_TOPIC_ARN,
      Message: JSON.stringify(message, null, 2),
      Subject: `Sherlock Ω Alert: ${alert.type}`
    }).promise();
  }

  console.log(`🚨 Sent ${alerts.length} alerts`);
}

/**
 * Get CORS headers
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,User-Agent',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  };
}

/**
 * Chunk array into smaller arrays
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}