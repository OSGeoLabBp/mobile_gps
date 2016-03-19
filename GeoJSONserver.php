<?php
/**
 * @name        GeoJSONserver - PostGIS-GeoJSON RESTful API in PHP
 * @version     1.0
 * @description RESTful PHP library for PostgreSQL CRUD functions. Read, delete, update and insert sanitized data with GeoJSON format into PostGIS table. Suitable for use in OpenLayers, Leaflet, etc.
 * @author      Gergő Gelencsér (http://github.com/programmerg)
 * @license     GNU GENERAL PUBLIC LICENSE v2
 * @link        https://github.com/OSGeoLabBp/mobile_gps
 */

class GeoJSONserver {
  
    protected $options = array();
    protected $db = null;
    protected $table = '';
    protected $item = null;
    protected $method = '';
    protected $request = array();
    
    public function __construct($opt_options = '') {

        $this->options = is_array($opt_options) ? $opt_options : array(
        
          // Connection parameters
          'HOST'         => 'localhost',
          'PORT'         => '5432',
          'DB'           => 'postgres',
          'USER'         => 'postgres',
          'PASS'         => '',
          
          // Geometry settings
          'tableSRID'    => '3857',
          'viewSRID'     => '3857',
          'geomName'     => 'geom',
          
          // List of readable tables
          // e.g.: 'tableName', ...
          'readable'     => array(),
          
          // List of writeable tables and the required attributes
          // e.g.: 'tableName' => array('columnName:boolean|numeric|date|datetime|timestamp|json|string', ...), ...
          // when no attribute type is set, string is the default
          'writeable'    => array(),
          'authRequired' => true,
          'authRealm'    => 'GeoJSONserver'
        );
    
        // Connect to PostgreSQL database using PHP's Database Object class
        // http://php.net/manual/en/class.pdo.php
        try {
            $this->db = new PDO('pgsql:host=' . $this->options['HOST'] . ';port=' . $this->options['PORT'] . ';dbname=' . $this->options['DB'], $this->options['USER'], $this->options['PASS']);
            $this->db->exec("set names utf8");
        } catch (PDOException $e) {
            $this->response( $e->getMessage(), 500);
        }
        
        // Basic authentication
        if ($this->options['authRequired']) {
            // TODO: query users from database
            $valid_users = null;
            $this->auth($valid_users, $this->options['authRealm']);
        }
        
        // Following the key principles of REST, each resource is represented by a URL,
        // where the action is the HTTP method used to access it.
        // https://en.wikipedia.org/wiki/Representational_state_transfer
        // https://en.wikipedia.org/wiki/Create,_read,_update_and_delete
        
        // Usage:
        // GET api/tablename - list of all rows in tablename
        // GET api/tablename/id - the ID item from tablename
        // POST api/tablename - insert a record into tablename
        // PUT api/tablename/id - update ID item in tablename
        // DELETE api/tablename/id - remove ID item from tablename
        
        // Retrieve the table and item ID from the URL
        // The $_GET['url'] is passed with .htaccess rewrite
        $url = explode('/', $_GET['url']);
        $this->table = preg_replace('/[^a-z0-9_]+/i', '', array_shift((array)$url));
        $this->item = preg_replace('/[^0-9]+/i', '', array_shift((array)$url));
        unset($_GET['url']); // we don't need this anymore
        
        // Get the HTTP method
        // in some cases DELETE and PUT requests are hidden inside a POST 
        $this->method = @trim($_SERVER['REQUEST_METHOD']);
        if ($this->method == 'POST' && array_key_exists('HTTP_X_HTTP_METHOD', $_SERVER)) {
            if ($_SERVER['HTTP_X_HTTP_METHOD'] == 'DELETE') {
                $this->method = 'DELETE';
            } else if ($_SERVER['HTTP_X_HTTP_METHOD'] == 'PUT') {
                $this->method = 'PUT';
            }
        }

    }
    
    public function __destruct() {
        // Close database connection
        $this->db = null;
    }    
      
    /**
     * Handle CRUD actions using HTTP methods mapped as follows:
     * GET - used for basic READ requests to the server
     * POST - used to CREATE a new object on the server
     * PUT - used to modify (UPDATE) an existing object on the server
     * DELETE - used to remove (DELETE) an object on the server
     */
    public function run() {
        switch($this->method) {
            case 'GET':
                $this->request = $_GET;
                $this->response(
                    $this->read($this->table, $this->item, $this->request, $this->options)
                );
                break;
            case 'POST':
                $this->request = $_POST;
                $this->response(
                    $this->create($this->table, $this->request, $this->options)
                );
                break;
            case 'PUT':
                // GET and POST are standard in PHP, PUT needs some raw data hack
                $_PUT = array(); parse_str(file_get_contents('php://input'), $_PUT);
                $this->request = $_PUT;
                $this->response(
                    $this->update($this->table, $this->item, $this->request, $this->options)
                );
                break;
            case 'DELETE':
                // DELETE is also not standard in PHP, so we find the url params in GET
                $this->request = $_GET;
                $this->response(
                    $this->delete($this->table, $this->item, $this->options)
                );
                break;
            default:
                $this->response('Allowed methods: GET, POST, PUT, DELETE', 405);
                break;
        }
    }
        
    /**
     * Write the response to the output in json format with optional HTTP satus codes
     * @param mixed $data this will be the output in json format
     * @param integer $code optional HTTP status code default 200
     */
    protected function response($data, $code = 200) {
        $json = json_encode($data);
        $hash = md5($json);
        $status = array(  
            200 => 'OK',
            201 => 'Created',
            204 => 'No Content',
            304 => 'Not Modified',
            400 => 'Bad Request',   
            401 => 'Unauthorized',   
            403 => 'Forbidden',
            404 => 'Not Found',   
            405 => 'Method Not Allowed',
            500 => 'Internal Server Error'
        );
        
        // Set HTTP status code in the header
        header('HTTP/1.1 ' . $status . ' ' . (isset($status[$code]) ? $status[$code] : $status[500]);
        header('Content-Type: application/json');
        
        // Enable open access across domains (CORS)
        // http://enable-cors.org/
        header("Access-Control-Allow-Orgin: *");
        header("Access-Control-Allow-Methods: *");

        // Save bandwith when nothing changed
        if ($this->method == 'GET') {
            header('Cache-Control: private');
            header('Etag: ' . $hash);
            if (@trim($_SERVER['HTTP_IF_NONE_MATCH']) == $hash) {
                header("HTTP/1.1 304 Not Modified");
                exit;
            }
        }

        // Write data to the output
        echo $json;
        // exit; // need to close the output here?
    }
    
    /**
     * Basic HTTP authentication
     * @param array $valid_users (key: username, value: password hash)
     * @param string $realm
     */
    protected function auth($valid_users, $realm = '') {
        if (!isset($_SERVER['PHP_AUTH_USER'])) {
            header('WWW-Authenticate: Basic realm="' . (!empty(realm) ? realm : 'myAPI') . '"');
            $this->response('Enter the username and password!', 401);
        } elseif (!($_SERVER['PHP_AUTH_USER']=='user' && $_SERVER['PHP_AUTH_PW']=='pass')) {
            // TODO: basic auth from $valid_users
            $this->response('Authentication required!', 403);
        }
    }
    
    /**
     * READ records from table
     * @param string $table table name
     * @param integer $id optional ID of record
     * @param array $request optional parameters from user like bbox
     * @param array $opt_options optional parameters overriding defaults
     * @return array in geojson structure
     */
    public function read($table, $id = '', $request = '', $opt_options = '') {
      
        $readable = isset($opt_options['readable']) ? $opt_options['readable'] : $this->options['readable'];
        $geomName = isset($opt_options['geomName']) ? $opt_options['geomName'] : $this->options['geomName'];
        $viewSRID = isset($opt_options['viewSRID']) ? $opt_options['viewSRID'] : $this->options['viewSRID'];
        
        // Chechek requested table in readable tables list
        if (!in_array($table, $readable)) {
            $this->response('Table not found or allowed.', 404);
            return false;
        }
        
        // TODO: where user_id = USERID
        if (isset($id)) {
            $where[] = 'id = ' . $id;
        } elseif (isset($request['bbox'])) {
            // If bbox variable is set, only return records that are within the bounding box
            // bbox should be a string in the form of 'southwest_lng,southwest_lat,northeast_lng,northeast_lat'
            $bbox = explode(',', $request['bbox']);
            $where[] = 'ST_Transform(' . $geomName . ', ' . $viewSRID . ') && ST_SetSRID(ST_MakeBox2D(ST_Point(' . (float)$bbox[0] . ', ' . (float)$bbox[1] . '), ST_Point(' . (float)$bbox[2] . ', ' . (float)$bbox[3] . ')), ' . $viewSRID . ')';
        }
        
        // Create the SQL query
        $sql = 'SELECT *, ST_AsGeoJSON(ST_Transform((' . $geomName . '), ' . $viewSRID . '), 6) AS geojson FROM ' . $table . (isset($where) ? ' WHERE ' . implode(' AND ',$where) : '');

        // Try query or error
        $query = $this->db->prepare($sql);
        if (!($query && $query->execute() !== false)) {
            $error = $query->errorInfo();
            $this->response($error[2], 500);
            return false;
        }

        // Build GeoJSON feature collection array
        $geojson = array(
            'type'      => 'FeatureCollection',
            'features'  => array()
        );

        // Loop through rows to build feature arrays
        while ($row = $rs->fetch(PDO::FETCH_ASSOC)) {
            $properties = $row;
            // Remove geojson and geometry fields from properties
            unset($properties['geojson']);
            unset($properties[$geomName]);
            $feature = array(
                'type'        => 'Feature',
                'geometry'    => json_decode($row['geojson'], true),
                'properties'  => $properties
            );
            // Add feature arrays to feature collection array
            array_push($geojson['features'], $feature);
        }
        
        return $geojson;
    }
    
    /**
     * INSERT record into table
     * @param string $table table name
     * @param array $request requested values from user
     * @param array $opt_options optional parameters overriding defaults
     * @return boolean|array ID of inserted record or false on error
     */
    public function create($table, $request, $opt_options = '') {
        
        $writeable = isset($opt_options['writeable']) ? $opt_options['writeable'] : $this->options['writeable'];
        $geomName = isset($opt_options['geomName']) ? $opt_options['geomName'] : $this->options['geomName'];
        $viewSRID = isset($opt_options['viewSRID']) ? $opt_options['viewSRID'] : $this->options['viewSRID'];
        $tableSRID = isset($opt_options['tableSRID']) ? $opt_options['tableSRID'] : $this->options['tableSRID'];
        
        // Chechek requested table in writeable tables list
        if (!in_array($table, $writeable)) {
            $this->response('Table not found or allowed.', 404);
            return false;
        }

        // TODO: set user_id = USERID server side
        
        // Collect the witeable columns and column types from requested table
        foreach ($writeable[$table] as $attribute) {
            $attribute = explode(':', $attribute);
            $columns[] = $attribute[0];
            $types[] = isset($attribute[1]) ? $attribute[1] : 'string';
            if ($attribute[0] == $geomName) {
                $values[] = 'ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON( :' . $attribute[0] . ' ), ' . $viewSRID . '), ' . $tableSRID . ')';
            } else {
                $values[] = ':' . $attribute[0];
            }
        }

        // Create the SQL query
        $sql = 'INSERT INTO ' . $table . ' ( ' . implode(', ', $columns) . ' ) VALUES ( ' . implode(', ', $values) . ' )';
        $query = $this->db->prepare($sql);

        // Loop through required columns
        for ($i = 0; $i < count($columns); $i++) {
            if (isset($request[$columns[$i]])) {
                $values[$i] = $request[$columns[$i]];
                
                // sanitize input based on predefined types
                switch ($types[$i]) {
                    case 'boolean':
                        $values[$i] = (bool)$values[$i];
                        break;
                    case 'numeric':
                        $values[$i] = (float)$values[$i];
                        break;
                    case 'date':
                        $values[$i] = date('Y-m-d', strtotime($values[$i]));
                        break;
                    case 'datetime':
                        $values[$i] = date('Y-m-d H:i:s', strtotime($values[$i]));
                        break;
                    case 'timestamp':
                        $values[$i] = strtotime($values[$i]);
                        break;
                    case 'json':
                        // enabled: a-zA-Z0-9_ [](){}.,\'"-:+
                        $values[$i] = preg_replace("([^\w\s\[\]\(\)\{\}\.\,\\\'\"\-\:\+])", '', $values[$i]);
                        $values[$i] = str_replace('\"','"',$values[$i]); // unescape quotes, to be sure 
                        //$values[$i] = json_decode($values[$i], true); // this will be null if not valid JSON
                        break;
                    case 'string':
                    default:
                        // enabled: a-zA-Z0-9_ [](){}.,!?@\/'"-*%:=+öÖüÜóÓőŐúÚéÉáÁűŰíÍ
                        $values[$i] = preg_replace("([^\w\s\[\]\(\)\{\}\.\,\!\?\@\\\/\'\"\-\*\%\:\=\+öÖüÜóÓőŐúÚéÉáÁűŰíÍ])", '', $values[$i]);
                        break;
                }
                if ($values[$i] == '') {
                    $values[$i] = null;
                }
                // Bind parameters (escape quotes automatically) to prevent SQL injection
                $query->bindParam(':'.$columns[$i], $values[$i]);
            } else {
                $this->response('Required attributes: ' . implode(', ', $columns), 400);
                return false;
            }
        }

        // Try query or error
        if (!($query && $query->execute() !== false && $query->rowCount() > 0)) {
            $error = $query->errorInfo();
            $this->response($error[2], 500);
            return false;
        }

        return array('id' => $query->lastInsertId());
    }
    
    /**
     * UPDATE record in table
     * @param string $table table name
     * @param integer $id ID of record
     * @param array $request requested values from user
     * @param array $opt_options optional parameters overriding defaults
     * @return boolean|array affected row count or false on error
     */
    public function update($table, $id, $request, $opt_options = '') {
        
        $writeable = isset($opt_options['writeable']) ? $opt_options['writeable'] : $this->options['writeable'];
        $geomName = isset($opt_options['geomName']) ? $opt_options['geomName'] : $this->options['geomName'];
        $viewSRID = isset($opt_options['viewSRID']) ? $opt_options['viewSRID'] : $this->options['viewSRID'];
        $tableSRID = isset($opt_options['tableSRID']) ? $opt_options['tableSRID'] : $this->options['tableSRID'];
        
        // Chechek requested table in writeable tables list
        if (!in_array($table, $writeable)) {
            $this->response('Table not found or allowed.', 404);
            return false;
        }
        
        // TODO: set user_id = USERID server side
        
        // Collect the witeable columns and column types from requested table
        foreach ($writeable[$table] as $attribute) {
            $attribute = explode(':', $attribute);
            $columns[] = $attribute[0];
            $types[] = isset($attribute[1]) ? $attribute[1] : 'string';
            if ($attribute[0] == $geomName) {
                $values[] = 'ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON( :' . $attribute[0] . ' ), ' . $viewSRID . '), ' . $tableSRID . ')';
            } else {
                $values[] = ':' . $attribute[0];
            }
            $columns_and_values[] = $attribute[0] . ' = :' . $attribute[0];
        }
        
        // Create the SQL query
        $sql = 'UPDATE ' . $table . ' SET ' . $columns_and_values . ' WHERE id = :id';
        $query = $this->db->prepare($sql);
        $query->bindParam(':id', $id);
        
        // Loop through required columns
        for ($i = 0; $i < count($columns); $i++) {
            if (isset($request[$columns[$i]])) {
                $values[$i] = $request[$columns[$i]];
                
                // sanitize input based on predefined types
                switch ($types[$i]) {
                    case 'boolean':
                        $values[$i] = (bool)$values[$i];
                        break;
                    case 'numeric':
                        $values[$i] = (float)$values[$i];
                        break;
                    case 'date':
                        $values[$i] = date('Y-m-d', strtotime($values[$i]));
                        break;
                    case 'datetime':
                        $values[$i] = date('Y-m-d H:i:s', strtotime($values[$i]));
                        break;
                    case 'timestamp':
                        $values[$i] = strtotime($values[$i]);
                        break;
                    case 'json':
                        // enabled: a-zA-Z0-9_ [](){}.,\'"-:+
                        $values[$i] = preg_replace("([^\w\s\[\]\(\)\{\}\.\,\\\'\"\-\:\+])", '', $values[$i]);
                        $values[$i] = str_replace('\"','"',$values[$i]); // unescape quotes, to be sure 
                        //$values[$i] = json_decode($values[$i], true); // this will be null if not valid JSON
                        break;
                    case 'string':
                    default:
                        // enabled: a-zA-Z0-9_ [](){}.,!?@\/'"-*%:=+öÖüÜóÓőŐúÚéÉáÁűŰíÍ
                        $values[$i] = preg_replace("([^\w\s\[\]\(\)\{\}\.\,\!\?\@\\\/\'\"\-\*\%\:\=\+öÖüÜóÓőŐúÚéÉáÁűŰíÍ])", '', $values[$i]);
                        break;
                }
                if ($values[$i] == '') {
                    $values[$i] = null;
                }
                // Bind parameters (escape quotes automatically) to prevent SQL injection
                $query->bindParam(':'.$columns[$i], $values[$i]);
            } else {
                $this->response('Required attributes: ' . implode(', ', $columns), 400);
                return false;
            }
        }
        
        // Try query or error
        if (!($query && $query->execute() !== false && $query->rowCount() > 0)) {
            $error = $query->errorInfo();
            $this->response($error[2], 500);
            return false;
        }

        return array('rowCount' => $query->rowCount());
    }
    
    /**
     * DELETE record from table
     * @param string $table table name
     * @param integer $id ID of record
     * @param array $opt_options optional parameters overriding defaults
     * @return boolean|array affected row count or false on error
     */
    public function delete($table, $id, $opt_options = '') {
      
        $writeable = isset($opt_options['writeable']) ? $opt_options['writeable'] : $this->options['writeable'];
        
        // Chechek requested table in writeable tables list
        if (!in_array($table, $writeable)) {
            $this->response('Table not found or allowed.', 404);
            return false;
        }
        
        // Create the SQL query
        $sql = 'DELETE FROM ' . $table . ' WHERE id = :id';
        $query = $this->db->prepare($sql);
        $query->bindParam(':id', $id);
        
        // Try query or error
        if (!($query && $query->execute() !== false && $query->rowCount() > 0)) {
            $error = $query->errorInfo();
            $this->response($error[2], 500);
            return false;
        }

        return array('rowCount' => $query->rowCount());
    }
    
}
